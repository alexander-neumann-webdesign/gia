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
	if (condition === null) {
		element.classList.toggle(className);
	} else {
		element.classList.toggle(className, !!condition);
	}
}

function modifyClass(nodes, className, action) {
	if (!nodes) return nodes;
	// ⚡ BOLT OPTIMIZATION: Avoid wrapping single nodes in an array [nodes] to prevent
	// unnecessary array memory allocations. We check nodeType to ensure elements
	// with a length property (like <form> or <select>) are still treated as single nodes.
	if (nodes.length !== undefined && nodes.nodeType === undefined) {
		for (let i = 0; i < nodes.length; i++) {
			nodes[i].classList[action](className);
		}
	} else {
		nodes.classList[action](className);
	}
	return nodes;
}

export function removeClass(nodes, className) {
	return modifyClass(nodes, className, "remove");
}

export function addClass(nodes, className) {
	return modifyClass(nodes, className, "add");
}

export function triggerEvent(
	element,
	eventType,
	params = null,
	options = {
		bubbles: true,
		cancelable: true,
		detail: null,
	},
) {
	options.detail = params;
	const event = new CustomEvent(eventType, options);
	element.dispatchEvent(event);
}

export function debounce(func, wait) {
	let timeout;
	let lastArgs = null;
	let lastThis = null;
	const later = () => {
		clearTimeout(timeout);
		if (lastArgs) {
			const args = lastArgs;
			const context = lastThis;
			lastArgs = null;
			lastThis = null;
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
