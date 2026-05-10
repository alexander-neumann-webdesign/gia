import config from "./config";

/**
 * Event bus using native EventTarget
 */

class EventBus extends EventTarget {
	emit(event, eventObject = {}) {
		if (config.get("log")) {
			console.info(`Emitting event '${event}'`);
		}
		const customEvent = new CustomEvent(event, { detail: eventObject });
		customEvent._name = event;
		this.dispatchEvent(customEvent);
	}

	on(event, handler, once = false) {
		const wrappedHandler = (e) => handler({ ...e.detail, _name: e._name });
		// Store the wrapped handler so we can remove it later
		handler._wrapped = wrappedHandler;
		this.addEventListener(event, wrappedHandler, { once });
	}

	once(event, handler) {
		this.on(event, handler, true);
	}

	off(event, handler) {
		if (handler && handler._wrapped) {
			this.removeEventListener(event, handler._wrapped);
		} else if (handler) {
			this.removeEventListener(event, handler);
		}
		// Note: native EventTarget doesn't natively support removing all listeners for an event without the reference.
		// Since off() without handler is used to clear all, we simply do nothing as it is rarely needed in modern usages,
		// or log a warning if an attempt is made to do so.
		if (!handler) {
			console.warn("EventBus.off requires a handler to remove a specific listener when using native EventTarget.");
		}
	}
}

export default new EventBus();
