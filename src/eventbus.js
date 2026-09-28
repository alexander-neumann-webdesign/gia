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

		// ⚡ BOLT OPTIMIZATION: Use logical deletion and in-place compaction
		// to avoid GC array allocation on every emit while preserving FIFO order.
		handlers._iterating = (handlers._iterating || 0) + 1;
		let hasNulls = false;
		const len = handlers.length;

		try {
			for (let i = 0; i < len; i++) {
				const cb = handlers[i];
				if (cb) {
					cb(eventObject);
				} else {
					hasNulls = true;
				}
			}
		} finally {
			handlers._iterating--;

			if (handlers._iterating === 0 && hasNulls) {
			let j = 0;
			for (let i = 0; i < handlers.length; i++) {
				if (handlers[i]) {
					handlers[j++] = handlers[i];
				}
			}
			handlers.length = j;
			}
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
			// Clear all listeners for this event if no handler provided
			if (this.listeners[event]) {
				this.listeners[event].length = 0;
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
			if (handlers._iterating) {
				handlers[index] = null; // Logical deletion during iteration
			} else {
				handlers.splice(index, 1); // Safe to splice if not iterating
			}
		}
	}
}

export default new EventBus();
