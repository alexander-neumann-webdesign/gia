export function query(selector, context = document) {
	if (typeof selector !== "string") {
		return selector;
	}

	return context.querySelector(selector);
}

export function queryAll(selector, context = document) {
	if (typeof selector !== "string") {
		return selector;
	}

	return context.querySelectorAll(selector);
}

export function toggleClass(element, className, condition = null) {
	if (!element || !className) return;
	const hasSpaces = typeof className === "string" && className.indexOf(" ") !== -1;
	if (hasSpaces) {
		const classes = className.trim().split(/\s+/);
		for (let i = 0; i < classes.length; i++) {
			const cls = classes[i];
			if (cls) {
				if (condition === null) {
					element.classList.toggle(cls);
				} else {
					element.classList.toggle(cls, !!condition);
				}
			}
		}
	} else {
		if (condition === null) {
			element.classList.toggle(className);
		} else {
			element.classList.toggle(className, !!condition);
		}
	}
}

function _applyClassAction(node, className, action) {
	if (!node || !node.classList) return;
	const hasSpaces = typeof className === "string" && className.indexOf(" ") !== -1;
	if (hasSpaces) {
		const classes = className.trim().split(/\s+/);
		for (let i = 0; i < classes.length; i++) {
			const cls = classes[i];
			if (cls) node.classList[action](cls);
		}
	} else {
		node.classList[action](className);
	}
}

function modifyClass(nodes, className, action) {
	if (!nodes || !className) return nodes;
	// ⚡ BOLT OPTIMIZATION: Avoid wrapping single nodes in an array [nodes] to prevent
	// unnecessary array memory allocations. We check nodeType to ensure elements
	// with a length property (like <form> or <select>) are still treated as single nodes.
	if (nodes.length !== undefined && nodes.nodeType === undefined) {
		for (let i = 0; i < nodes.length; i++) {
			_applyClassAction(nodes[i], className, action);
		}
	} else {
		_applyClassAction(nodes, className, action);
	}
	return nodes;
}

export function removeClass(nodes, className) {
	return modifyClass(nodes, className, "remove");
}

export function addClass(nodes, className) {
	return modifyClass(nodes, className, "add");
}

const defaultTriggerOptions = {
	bubbles: true,
	cancelable: true,
	detail: null,
};

export function triggerEvent(
	element,
	eventType,
	params = null,
	options = null,
) {
	let eventInit;
	if (options) {
		options.detail = params;
		eventInit = options;
	} else if (params === null) {
		eventInit = defaultTriggerOptions;
	} else {
		eventInit = {
			bubbles: true,
			cancelable: true,
			detail: params,
		};
	}
	const event = new CustomEvent(eventType, eventInit);
	element.dispatchEvent(event);
}

export function debounce(func, wait) {
	let timeout;
	let lastArgs = null;
	let lastThis = null;
	const later = () => {
		clearTimeout(timeout);
		if (lastArgs) {
			const context = lastThis;
			const args = lastArgs;
			lastThis = null;
			lastArgs = null;
			// ⚡ BOLT OPTIMIZATION: Avoid spread/rest operator allocations
			// and maintain the correct 'this' context by using .apply()
			func.apply(context, args);
		}
	};
	const executedFunction = function() {
		lastArgs = arguments;
		lastThis = this;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
	executedFunction.cancel = function() {
		clearTimeout(timeout);
		lastArgs = null;
		lastThis = null;
	};
	return executedFunction;
}

export function throttle(func, wait) {
	let timeout = null;
	let lastArgs = null;
	let lastThis = null;
	let lastCallTime = 0;

	const executedFunction = function () {
		const now = Date.now();
		const remaining = wait - (now - lastCallTime);
		lastArgs = arguments;
		lastThis = this;

		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			lastCallTime = now;
			const context = lastThis;
			const args = lastArgs;
			lastThis = null;
			lastArgs = null;
			// ⚡ BOLT OPTIMIZATION: Avoid spread/rest operator allocations
			// and maintain the correct 'this' context by using .apply()
			func.apply(context, args);
		} else if (!timeout) {
			timeout = setTimeout(() => {
				lastCallTime = Date.now();
				timeout = null;
				const context = lastThis;
				const args = lastArgs;
				lastThis = null;
				lastArgs = null;
				func.apply(context, args);
			}, remaining);
		}
	};

	executedFunction.cancel = function () {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
		lastArgs = null;
		lastThis = null;
		lastCallTime = 0;
	};

	return executedFunction;
}
