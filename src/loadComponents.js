import config from "./config.js";
import createInstance from "./createInstance.js";
import getComponentFromElement from "./getComponentFromElement.js";
import { queryAll } from "./utils.js";

/**
 * Creates instances of components without creating duplicates on elements within the context
 * @param components: object of components to load
 * @param context: DOM element
 */

export default function loadComponents(components = {}, context = document.documentElement) {
	if (!components) {
		console.warn("App has no components");
		return;
	}

	// ⚡ BOLT OPTIMIZATION: Check if object is empty using a fast-failing for...in loop
	// This avoids allocating an array with Object.keys() every time loadComponents is called
	let hasComponents = false;
	for (const _k in components) {
		hasComponents = true;
		break;
	}

	if (!hasComponents) {
		console.warn("App has no components");
		return;
	}

	const initialisedComponents = [];
	const attrName = `${config.get("attrPrefix")}-component`;

	const elements = queryAll(`[${attrName}]`, context);
	const elementsLength = elements.length;

	// ⚡ BOLT OPTIMIZATION: Inline processElement logic to avoid allocating a closure function
	// and to prevent additional garbage collection overhead per element.
	for (let i = 0; i < elementsLength; i++) {
		const element = elements[i];
		// ⚡ BOLT OPTIMIZATION: Inline getComponentFromElement to avoid function call overhead
		// and string-type checking since we know element is a DOM node.
		const instance = element.__gia_component__;

		if (!instance) {
			const componentName = element.getAttribute(attrName);

			if (typeof components[componentName] === "function") {
				initialisedComponents.push(createInstance(element, componentName, components[componentName]));
			} else {
				console.warn(`Constructor "${componentName}" not found.`);
			}
		}
	}

	if (context instanceof Element && context.hasAttribute(attrName)) {
		// ⚡ BOLT OPTIMIZATION: Inline getComponentFromElement to avoid function call overhead
		const instance = context.__gia_component__;

		if (!instance) {
			const componentName = context.getAttribute(attrName);

			if (typeof components[componentName] === "function") {
				initialisedComponents.push(createInstance(context, componentName, components[componentName]));
			} else {
				console.warn(`Constructor "${componentName}" not found.`);
			}
		}
	}

	// call _load/require/mount
	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid array iteration overhead
	for (let i = 0; i < initialisedComponents.length; i++) {
		initialisedComponents[i]._load();
	}
}
