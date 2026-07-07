import config from "./config.js";

/**
 * Event bus using pure JS for Zero-GC and maximum performance
 */

class EventBus {
	constructor() {
		this.listeners = Object.create(null);
	}

	emit(event, eventObject = {}) {
		if (config.get("log")) {
			console.info(`Emitting event '${event}'`);
		}

		const handlers = this.listeners[event];
		if (!handlers || handlers.length === 0) return;

		// ⚡ OPTIMIZATION: Mutate eventObject instead of using spread operator
		// to avoid GC allocation overhead on every emit.
		if (eventObject && typeof eventObject === 'object') {
			eventObject._name = event;
		}

		// ⚡ OPTIMIZATION: Standard for loop over array, avoids Iterator overhead.
		// We copy the array in case a handler calls .off() synchronously causing index shifts.
		const callbacks = handlers.slice();
		for (let i = 0; i < callbacks.length; i++) {
			callbacks[i](eventObject);
		}
	}

	on(event, handler, once = false) {
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

		this.listeners[event].push(actualHandler);
	}

	once(event, handler) {
		this.on(event, handler, true);
	}

	off(event, handler) {
		if (!handler) {
			console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
			this.listeners[event] = [];
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
			// ⚡ OPTIMIZATION: Swap-and-Pop O(1) removal to prevent array element shifts
			if (index === handlers.length - 1) {
				handlers.pop();
			} else {
				handlers[index] = handlers[handlers.length - 1];
				handlers.pop();
			}
		}
	}
}

export default new EventBus();
