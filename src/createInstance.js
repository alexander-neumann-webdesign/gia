import config from "./config.js";
import { components } from "./store.js";

/**
 * Creates and returns instance of component
 * @param element: DOM element
 * @param componentName: Component name
 * @param component: Component constructor
 * @param options: options object passed into a component
 */

export default function createInstance(element, componentName, component, options) {
	// Check if the component is already attached before trying to create a new one.
	if (components.has(element)) {
		console.warn(`Component "${componentName}" already exists.`);
		return components.get(element);
	}

	try {
		// create instance of component
		const instance = new component(element, options);

		if (config.get("log")) {
			console.info(`Created instance of component "${componentName}".`);
		}

		return instance;
	} catch (err) {
		console.error(`Failed to create component "${componentName}".`, err);
		// BaseComponent's constructor registers the instance in the store before a subclass
		// constructor runs. If construction failed afterwards, drop that half-built instance so
		// later mount attempts can retry instead of reusing it, and release anything it bound.
		// unmount() is skipped because mount() never ran.
		const partial = components.get(element);
		if (partial) {
			if (typeof partial._destroy === "function") {
				try {
					partial._destroy(true);
				} catch (_e) {}
			}
			components.delete(element);
		}
		return null;
	}
}
