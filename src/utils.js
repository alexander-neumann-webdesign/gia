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
	const iterable = Array.isArray(nodes) || nodes instanceof NodeList ? nodes : [nodes];
	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid NodeList iteration overhead
	for (let i = 0; i < iterable.length; i++) {
		iterable[i].classList[action](className);
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
