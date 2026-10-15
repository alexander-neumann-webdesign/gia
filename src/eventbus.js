import config from "./config.js";

/**
 * Event bus using pure JS for Zero-GC and maximum performance
 */

class EventBus {
	constructor() {
		this.listeners = Object.create(null);
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

		const handlers = this.listeners[event];
		const globalHandlers = this._hasWildcards > 0 ? this.listeners["*"] : null;

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
				const ph = this.listeners[event.substring(0, idx + 1) + "*"];
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
				const ph = this.listeners[prefixKey];
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
		const isObj = options && typeof options === "object";
		const once = isObj ? !!options.once : !!options;
		const signal = isObj ? options.signal : null;

		if (signal && signal.aborted) return;

		if (event.indexOf("*") !== -1) {
			this._hasWildcards++;
		}

		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}

		let actualHandler = handler;
		if (once) {
			actualHandler = (data) => {
				this.off(event, actualHandler);
				handler(data);
			};
			if (!handler._wrappedHandlers) {
				handler._wrappedHandlers = Object.create(null);
			}
			handler._wrappedHandlers[event] = actualHandler;
		}

		if (signal) {
			signal.addEventListener(
				"abort",
				() => {
					this.off(event, actualHandler);
				},
				{ once: true },
			);
		}

		this.listeners[event].push(actualHandler);
	}

	once(event, handler, options = {}) {
		const opts = typeof options === "object" && options !== null ? { ...options, once: true } : { once: true };
		this.on(event, handler, opts);
	}

	off(event, handler) {
		if (!handler) {
			// Clear all listeners for this event if no handler provided
			const handlers = this.listeners[event];
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

		const handlers = this.listeners[event];
		if (!handlers) return;

		let targetHandler = handler;
		if (handler._wrappedHandlers && handler._wrappedHandlers[event]) {
			targetHandler = handler._wrappedHandlers[event];
			delete handler._wrappedHandlers[event];
		} else if (handler._wrapped) {
			targetHandler = handler._wrapped;
		}

		const index = handlers.indexOf(targetHandler);
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

const globalObj =
	typeof globalThis !== "undefined"
		? globalThis
		: typeof window !== "undefined"
		? window
		: typeof global !== "undefined"
		? global
		: {};

const eventbusInstance = globalObj.__gia_eventbus__ || (globalObj.__gia_eventbus__ = new EventBus());

export default eventbusInstance;
