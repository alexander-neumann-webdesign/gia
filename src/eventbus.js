import config from "./config.js";

/**
 * The listener entry off(event, handler) removes: the once() wrapper registered for `handler`
 * when it is still in `list`, else `handler` itself. The wrapper lookup is consumed either way,
 * so a wrapper that is no longer listed (e.g. a once() that fired in another bundle) can never
 * shadow a plain listener for the same handler.
 */
function _target(list, event, handler) {
	const wrapped = handler._wrappedHandlers;
	const wrapper = wrapped && wrapped[event];
	if (!wrapper) return handler;
	delete wrapped[event];
	return list.indexOf(wrapper) !== -1 ? wrapper : handler;
}

/**
 * Lightweight event emitter used by the Mini build, and the base of the full EventBus
 * (which adds wildcard dispatch and removal-safe iteration on top of it).
 */
class MiniEventBus {
	constructor() {
		this._listeners = Object.create(null);
	}

	emit(event, eventObject) {
		const list = this._listeners[event];
		if (list && list.length) {
			if (!eventObject || typeof eventObject !== "object") {
				eventObject = { _name: event };
			} else {
				eventObject._name = event;
			}
			const copy = list.slice();
			for (let i = 0; i < copy.length; i++) {
				copy[i](eventObject);
			}
		}
	}

	on(event, handler, options = false) {
		const isObj = options && typeof options === "object";
		const once = isObj ? !!options.once : !!options;
		const signal = isObj ? options.signal : null;
		if (signal && signal.aborted) return;

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
			wrapped[event] = actual;
		}
		(this._listeners[event] = this._listeners[event] || []).push(actual);
		if (signal) {
			signal.addEventListener("abort", remove, { once: true });
		}
	}

	once(event, handler, options = {}) {
		const opts = typeof options === "object" && options !== null ? { ...options, once: true } : { once: true };
		this.on(event, handler, opts);
	}

	off(event, handler) {
		if (!handler) {
			delete this._listeners[event];
			return;
		}
		const list = this._listeners[event];
		if (list) {
			const idx = list.indexOf(_target(list, event, handler));
			if (idx !== -1) list.splice(idx, 1);
		}
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
 * Event bus using pure JS for Zero-GC and maximum performance
 */

class EventBus extends MiniEventBus {
	constructor() {
		super();
		this._iterating = Object.create(null);
		this._hasWildcards = 0;
	}

	_dispatchToHandlers(eventName, handlers, eventObject) {
		if (!handlers || handlers.length === 0) return;
		this._iterating[eventName] = (this._iterating[eventName] || 0) + 1;
		const len = handlers.length;
		try {
			for (let i = 0; i < len; i++) {
				const callback = handlers[i];
				if (callback) {
					callback(eventObject);
				}
			}
		} finally {
			this._iterating[eventName]--;
			if (this._iterating[eventName] === 0) {
				let writeIndex = 0;
				for (let i = 0; i < handlers.length; i++) {
					if (handlers[i] !== null) {
						handlers[writeIndex++] = handlers[i];
					}
				}
				handlers.length = writeIndex;
			}
		}
	}

	emit(event, eventObject) {
		if (config.get("log")) {
			console.info(`Emitting event '${event}'`);
		}

		const handlers = this._listeners[event];
		const globalHandlers = this._hasWildcards > 0 ? this._listeners["*"] : null;

		let hasAny = (handlers && handlers.length > 0) || (globalHandlers && globalHandlers.length > 0);

		const sep =
			this._hasWildcards > 0
				? event.indexOf(":") !== -1
					? ":"
					: event.indexOf(".") !== -1
					? "."
					: null
				: null;

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

		// ⚡ BOLT OPTIMIZATION: Mutate or initialize eventObject lazily only when listeners exist
		// to avoid GC allocation overhead on emissions with zero listeners.
		if (!eventObject || typeof eventObject !== "object") {
			eventObject = { _name: event };
		} else {
			eventObject._name = event;
		}

		if (handlers && handlers.length > 0) {
			this._dispatchToHandlers(event, handlers, eventObject);
		}

		if (sep !== null) {
			let idx = 0;
			while ((idx = event.indexOf(sep, idx)) !== -1) {
				const prefixKey = event.substring(0, idx + 1) + "*";
				const ph = this._listeners[prefixKey];
				if (ph && ph.length > 0) {
					this._dispatchToHandlers(prefixKey, ph, eventObject);
				}
				idx++;
			}
		}

		if (globalHandlers && globalHandlers.length > 0) {
			this._dispatchToHandlers("*", globalHandlers, eventObject);
		}
	}

	on(event, handler, options = false) {
		const signal = options && typeof options === "object" ? options.signal : null;
		if (event.indexOf("*") !== -1 && !(signal && signal.aborted)) {
			this._hasWildcards++;
		}
		super.on(event, handler, options);
	}

	off(event, handler) {
		if (!handler) {
			// Clear all listeners for this event if no handler provided
			const handlers = this._listeners[event];
			if (handlers) {
				if (event.indexOf("*") !== -1) {
					for (let i = 0; i < handlers.length; i++) {
						if (handlers[i] !== null && this._hasWildcards > 0) {
							this._hasWildcards--;
						}
					}
				}
				if (this._iterating && this._iterating[event] > 0) {
					for (let i = 0; i < handlers.length; i++) {
						handlers[i] = null;
					}
				} else {
					handlers.length = 0;
				}
			}
			return;
		}

		const handlers = this._listeners[event];
		if (!handlers) return;

		const index = handlers.indexOf(_target(handlers, event, handler));
		if (index !== -1) {
			if (event.indexOf("*") !== -1 && this._hasWildcards > 0) {
				this._hasWildcards--;
			}
			if (this._iterating && this._iterating[event] > 0) {
				handlers[index] = null;
			} else {
				handlers.splice(index, 1);
			}
		}
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
		Object.setPrototypeOf(eventbusInstance, EventBus.prototype);
		eventbusInstance._iterating = Object.create(null);
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

// Named class exports are for tests; the bundle entries only re-export the shared instance
export { MiniEventBus, EventBus };

export default eventbusInstance;
