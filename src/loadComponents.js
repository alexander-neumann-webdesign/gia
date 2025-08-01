import config from "./config";
import createInstance from "./createInstance";
import getComponentFromElement from "./getComponentFromElement";
import { queryAll } from "./utils";

/**
 * Creates instances of components without creating duplicates on elements within the context
 * @param components: object of components to load
 * @param context: DOM element
 */

export default function loadComponents(
	components = {},
	context = document.documentElement,
) {
	if (!components || Object.keys(components).length === 0) {
		console.warn("App has no components");
		return;
	}

	const initialisedComponents = [];
	const attrName = `[${config.get("attrPrefix")}-component]`;

	queryAll(attrName, context).forEach((element) => {
		const instance = getComponentFromElement(element);

		if (instance) {
			console.warn("Error: instance exists: ", instance);
			return true; // continue
		}

		const componentName = element.getAttribute(attrName);

		if (typeof components[componentName] === "function") {
			initialisedComponents.push(
				createInstance(element, componentName, components[componentName]),
			);
		} else {
			console.warn(`Constructor "${componentName}" not found.`);
		}
	});

	// call _load/require/mount
	initialisedComponents.forEach((component) => {
		component._load();
	});
}
