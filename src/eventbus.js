import config from "./config.js";

/**
 * Event bus using pure JS for Zero-GC and maximum performance
 */

class EventBus {
	constructor() {
		this.listeners = Object.create(null);
		this._iterating = Object.create(null);
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

		// ⚡ OPTIMIZATION: Use logical deletion and in-place array compaction to avoid GC churn
		// from array slicing, while maintaining safe FIFO execution order during synchronous `.off()`
		// calls or exceptions.
		this._iterating[event] = (this._iterating[event] || 0) + 1;
		const len = handlers.length;
		try {
			for (let i = 0; i < len; i++) {
				const callback = handlers[i];
				if (callback) {
					callback(eventObject);
				}
			}
		} finally {
			this._iterating[event]--;
			if (this._iterating[event] === 0) {
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
			const handlers = this.listeners[event];
			if (handlers) {
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
			if (this._iterating && this._iterating[event] > 0) {
				handlers[index] = null;
			} else {
				handlers.splice(index, 1);
			}
		}
	}
}

export default new EventBus();
