/**
 * The listener entry off(event, handler) removes: a once() wrapper registered for `handler`
 * while one is still in `list`, else `handler` itself.
 * - handler._wrappedHandlers[event] names the latest wrapper (also read by older Gia bundles).
 *   The lookup is consumed either way, so a wrapper that is no longer listed (e.g. a once() that
 *   fired in another bundle) can never shadow a plain listener for the same handler.
 * - Every wrapper also points back at its handler (_onceHandler), so when the same handler was
 *   registered with once() more than once, each off() finds the next remaining wrapper.
 * Both property names are reserved from mangling: wrappers are shared by every bundle.
 */
function _target(list, event, handler) {
	const wrapped = handler._wrappedHandlers;
	const wrapper = wrapped && wrapped[event];
	if (wrapper) {
		delete wrapped[event];
		if (list.indexOf(wrapper) !== -1) return wrapper;
	}
	for (let i = 0; i < list.length; i++) {
		if (list[i] && list[i]._onceHandler === handler) return list[i];
	}
	return handler;
}

/**
 * The object handlers receive: the caller's object tagged with the event name (documented as
 * `event._name`), or a new { _name } object for a missing or primitive payload. A frozen or
 * sealed payload cannot be tagged and is passed through as is instead of throwing.
 */
function _payload(eventObject, event) {
	if (!eventObject || typeof eventObject !== "object") return { _name: event };
	try {
		eventObject._name = event;
	} catch (_e) {
		// not extensible / read-only _name
	}
	return eventObject;
}

/**
 * Lightweight event emitter used by the Mini build, and the base of the full EventBus (which adds
 * wildcard dispatch on top of it).
 *
 * Dispatch follows DOM event semantics without allocating: a listener removed during an emit is
 * skipped if its turn has not come yet, and one added during an emit first runs on the next one.
 * While any emit is in progress (_depth > 0), off() sets entries to null instead of splicing, and
 * the arrays that got holes are compacted once the outermost emit has finished.
 */
class MiniEventBus {
	constructor() {
		this._listeners = Object.create(null);
		this._depth = 0;
		this._dirty = [];
	}

	/** Calls the listeners of `list` that were registered when the dispatch started. */
	_dispatch(list, eventObject) {
		const len = list.length;
		for (let i = 0; i < len; i++) {
			const cb = list[i];
			if (cb) cb(eventObject);
		}
	}

	/** Runs `fn` as one emit, compacting the arrays that off() left holes in once it is the outermost. */
	_emitting(fn, a, b, c) {
		this._depth++;
		try {
			fn.call(this, a, b, c);
		} finally {
			if (--this._depth === 0 && this._dirty.length) {
				const dirty = this._dirty;
				for (let d = 0; d < dirty.length; d++) {
					const list = dirty[d];
					let w = 0;
					for (let i = 0; i < list.length; i++) {
						if (list[i]) list[w++] = list[i];
					}
					list.length = w;
				}
				dirty.length = 0;
			}
		}
	}

	/** Removes entry `idx` of `list`: in place now, or as a hole while an emit may be iterating it. */
	_removeAt(list, idx) {
		if (this._depth > 0) {
			list[idx] = null;
			this._dirty.push(list);
		} else {
			list.splice(idx, 1);
		}
	}

	emit(event, eventObject) {
		const list = this._listeners[event];
		if (list && list.length) {
			this._emitting(this._dispatch, list, _payload(eventObject, event));
		}
	}

	/** Adds a listener and returns a function that removes it. */
	on(event, handler, options = false) {
		const isObj = options && typeof options === "object";
		const once = isObj ? !!options.once : !!options;
		const signal = isObj ? options.signal : null;
		if (signal && signal.aborted) return () => {};

		let actual = handler;
		let remove = () => this.off(event, actual);
		if (once) {
			const wrapped = handler._wrappedHandlers || (handler._wrappedHandlers = Object.create(null));
			// Removes the wrapper and forgets it, so a fired or aborted once() leaves no stale
			// wrapper behind that would make a later off(event, handler) miss a plain listener
			remove = () => {
				this.off(event, actual);
				if (wrapped[event] === actual) delete wrapped[event];
			};
			actual = (d) => {
				remove();
				handler(d);
			};
			actual._onceHandler = handler;
			wrapped[event] = actual;
		}
		(this._listeners[event] = this._listeners[event] || []).push(actual);
		if (signal) {
			signal.addEventListener("abort", remove, { once: true });
		}
		// Calls the public off(), so it keeps working after a full bundle upgrades this bus
		return remove;
	}

	once(event, handler, options = {}) {
		const opts = typeof options === "object" && options !== null ? { ...options, once: true } : { once: true };
		return this.on(event, handler, opts);
	}

	/** Removes one listener, or every listener of `event` when `handler` is omitted. Returns how many. */
	off(event, handler) {
		const list = this._listeners[event];
		if (!list) return 0;
		if (!handler) {
			let removed = 0;
			for (let i = list.length - 1; i >= 0; i--) {
				if (list[i]) {
					this._removeAt(list, i);
					removed++;
				}
			}
			return removed;
		}
		const idx = list.indexOf(_target(list, event, handler));
		if (idx === -1) return 0;
		this._removeAt(list, idx);
		return 1;
	}

	channel(namespace) {
		const prefix = namespace.endsWith(":") ? namespace : `${namespace}:`;
		return {
			emit: (e, d) => this.emit(`${prefix}${e}`, d),
			on: (e, fn, o) => this.on(`${prefix}${e}`, fn, o),
			once: (e, fn, o) => this.once(`${prefix}${e}`, fn, o),
			off: (e, fn) => this.off(`${prefix}${e}`, fn),
		};
	}
}

/**
 * Full event bus: adds wildcard listeners ("*" for every event, "prefix:*" / "prefix.*" for a
 * namespace) to MiniEventBus.
 */
class EventBus extends MiniEventBus {
	constructor() {
		super();
		this._hasWildcards = 0;
	}

	emit(event, eventObject) {
		const handlers = this._listeners[event];
		const wild = this._hasWildcards > 0;
		const globalHandlers = wild ? this._listeners["*"] : null;
		const sep = wild ? (event.indexOf(":") !== -1 ? ":" : event.indexOf(".") !== -1 ? "." : null) : null;

		let hasAny = (handlers && handlers.length > 0) || (globalHandlers && globalHandlers.length > 0);
		if (!hasAny && sep !== null) {
			let idx = 0;
			while ((idx = event.indexOf(sep, idx)) !== -1) {
				const ph = this._listeners[event.substring(0, idx + 1) + "*"];
				if (ph && ph.length > 0) {
					hasAny = true;
					break;
				}
				idx++;
			}
		}
		if (!hasAny) return;

		// ⚡ BOLT OPTIMIZATION: Tag or create the payload lazily, only when listeners exist,
		// to avoid GC allocation overhead on emissions with zero listeners.
		this._emitting(this._emitAll, event, _payload(eventObject, event), sep);
	}

	_emitAll(event, eventObject, sep) {
		const handlers = this._listeners[event];
		if (handlers) this._dispatch(handlers, eventObject);

		if (sep !== null) {
			let idx = 0;
			while ((idx = event.indexOf(sep, idx)) !== -1) {
				const ph = this._listeners[event.substring(0, idx + 1) + "*"];
				if (ph) this._dispatch(ph, eventObject);
				idx++;
			}
		}

		const globalHandlers = this._hasWildcards > 0 ? this._listeners["*"] : null;
		if (globalHandlers) this._dispatch(globalHandlers, eventObject);
	}

	on(event, handler, options = false) {
		const signal = options && typeof options === "object" ? options.signal : null;
		if (event.indexOf("*") !== -1 && !(signal && signal.aborted)) {
			this._hasWildcards++;
		}
		return super.on(event, handler, options);
	}

	off(event, handler) {
		const removed = super.off(event, handler);
		if (removed && event.indexOf("*") !== -1) {
			this._hasWildcards = Math.max(0, this._hasWildcards - removed);
		}
		return removed;
	}
}

const EventBusClass =
	typeof __GIA_MINI__ !== "undefined" && __GIA_MINI__ ? MiniEventBus : EventBus;

let eventbusInstance = globalThis.__gia_eventbus__;

if (typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) {
	const FULL_BUS = Symbol.for("gia.eventbus.full");
	if (!EventBus.prototype[FULL_BUS]) {
		Object.defineProperty(EventBus.prototype, FULL_BUS, { value: true });
	}
	if (eventbusInstance && !eventbusInstance[FULL_BUS] && eventbusInstance._listeners) {
		// A mini bundle created the shared bus first. Upgrade that same object in place so
		// wildcard listeners work page-wide: every bundle already holds a reference to it, and the
		// listener map (event -> handler array) has the same shape in both implementations.
		// The mini bundle's own fields carry its own mangled names, which may equal names of the
		// full bundle's methods and would shadow them: keep only the shared listener map
		for (const key of Object.keys(eventbusInstance)) {
			if (key !== "_listeners") delete eventbusInstance[key];
		}
		Object.setPrototypeOf(eventbusInstance, EventBus.prototype);
		eventbusInstance._depth = 0;
		eventbusInstance._dirty = [];
		let wildcards = 0;
		for (const event in eventbusInstance._listeners) {
			if (event.indexOf("*") !== -1) {
				wildcards += eventbusInstance._listeners[event].length;
			}
		}
		eventbusInstance._hasWildcards = wildcards;
	}
}

if (!eventbusInstance) {
	eventbusInstance = globalThis.__gia_eventbus__ = new EventBusClass();
}

export default eventbusInstance;
