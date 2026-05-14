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
	let componentsEmpty = true;
	if (components) {
		for (const key in components) {
			if (Object.prototype.hasOwnProperty.call(components, key)) {
				componentsEmpty = false;
				break;
			}
		}
	}

	if (componentsEmpty) {
		console.warn("App has no components");
		return;
	}

	const initialisedComponents = [];
	const attrName = `${config.get("attrPrefix")}-component`;

	const elements = queryAll(`[${attrName}]`, context);
	const elementsLength = elements.length;

	const processElement = (element) => {
		const instance = getComponentFromElement(element);

		if (instance) {
			return;
		}

		const componentName = element.getAttribute(attrName);

		if (typeof components[componentName] === "function") {
			initialisedComponents.push(createInstance(element, componentName, components[componentName]));
		} else {
			console.warn(`Constructor "${componentName}" not found.`);
		}
	};

	for (let i = 0; i < elementsLength; i++) {
		processElement(elements[i]);
	}

	if (context instanceof Element && context.hasAttribute(attrName)) {
		processElement(context);
	}

	// call _load/require/mount
	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid array iteration overhead
	for (let i = 0; i < initialisedComponents.length; i++) {
		initialisedComponents[i]._load();
	}
}
