import { components } from "./store.js";

/**
 * Creates and mounts a component instance on an element (mount() runs after require() for a
 * Component). Returns the existing instance if the element already has one.
 * @param element: DOM element
 * @param componentName: Component name
 * @param component: Component constructor
 * @param options: options object passed into a component
 */
export default function createInstance(element, componentName, component, options) {
	if (components.has(element)) {
		return constructInstance(element, componentName, component, options); // warns, returns it
	}
	const instance = constructInstance(element, componentName, component, options);
	if (instance) instance._load();
	return instance;
}

/**
 * Constructs an instance without mounting it; loadComponents() mounts a whole batch afterwards,
 * in priority order.
 */
export function constructInstance(element, componentName, component, options) {
	// Check if the component is already attached before trying to create a new one.
	if (components.has(element)) {
		console.warn(`Component "${componentName}" already exists.`);
		return components.get(element);
	}

	try {
		// create instance of component
		return new component(element, options);
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
