import config from "./config";
import getComponentFromElement from "./getComponentFromElement";

/**
 * Destroys and removes instance from DOM element
 * @param element: DOM element
 */

// export default function destroyInstance(element) {
// 	const instance = getComponentFromElement(element);
// 	if (instance) {
// 		const name = instance._name;
// 		instance.unmount();
// 		element.__gia_component__ = null;
// 		if (config.get("log")) {
// 			console.info(`Removed component "${name}".`);
// 		}
// 	}
// }

/**
 * Destroys and removes instance from DOM element
 * @param element: DOM element
 */
export default function destroyInstance(element) {
	const instance = getComponentFromElement(element);

	if (instance) {
		const name = instance._name || "Unknown";

		// If unmount() throws an error (e.g. user tries to remove a listener that doesn't exist),
		// we still want to finish cleaning up the memory references below.
		try {
			if (typeof instance._destroy === "function") {
				instance._destroy();
			} else {
				instance.unmount();
			}
		} catch (err) {
			console.error(`Gia: Error unmounting component "${name}".`, err);
		}

		// DOM CLEANUP
		// Remove the reference from the DOM element
		element.__gia_component__ = null;

		// The instance holds a reference to the element ("this.element").
		// We must break this link so the Garbage Collector can free both objects.
		if (instance.element) {
			instance.element = null;
		}

		if (config.get("log")) {
			console.info(`Removed component "${name}".`);
		}
	}
}
