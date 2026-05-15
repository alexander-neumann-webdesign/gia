import config from "./config.js";

/**
 * Event bus using native EventTarget
 */

class EventBus extends EventTarget {
	emit(event, eventObject = {}) {
		if (config.get("log")) {
			console.info(`Emitting event '${event}'`);
		}
		// ⚡ BOLT OPTIMIZATION: Create the detail payload once per emit rather than inside every listener's wrapper.
		// This saves N object spread allocations where N is the number of listeners.
		const detail = { ...eventObject, _name: event };
		const customEvent = new CustomEvent(event, { detail });
		customEvent._name = event;
		this.dispatchEvent(customEvent);
	}

	on(event, handler, once = false) {
		let wrappedHandlers = handler._wrappedHandlers;
		if (!wrappedHandlers) {
			wrappedHandlers = new Map();
			handler._wrappedHandlers = wrappedHandlers;
		}

		let wrappedHandler = wrappedHandlers.get(event);
		if (!wrappedHandler) {
			// ⚡ BOLT OPTIMIZATION: Prevent object spread allocation {...e.detail} on every event listener
			// by using the pre-spread detail object created in emit().
			wrappedHandler = (e) => {
				if (e.detail && e.detail._name === e._name) {
					handler(e.detail);
				} else {
					handler({ ...e.detail, _name: e._name });
				}
			};
			wrappedHandlers.set(event, wrappedHandler);
		}

		this.addEventListener(event, wrappedHandler, { once });
	}

	once(event, handler) {
		this.on(event, handler, true);
	}

	off(event, handler) {
		if (handler && handler._wrappedHandlers) {
			const wrappedHandler = handler._wrappedHandlers.get(event);
			if (wrappedHandler) {
				this.removeEventListener(event, wrappedHandler);
			}
		} else if (handler && handler._wrapped) {
			// Backwards compatibility if any old handlers exist
			this.removeEventListener(event, handler._wrapped);
		} else if (handler) {
			this.removeEventListener(event, handler);
		}

		if (!handler) {
			console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
		}
	}
}

export default new EventBus();
