import { components } from "./store.js";
import { resolveElement } from "./getComponentFromElement.js";
import { cancelDeferredMount } from "./deferredMount.js";

/**
 * Destroys and removes instance from DOM element
 * @param element: DOM element
 */
export default function destroyInstance(element) {
	if (!element) return;

	// ⚡ BOLT OPTIMIZATION: Inline getComponentFromElement to avoid function call overhead
	// inside the extremely hot autoMount MutationObserver removal loop.
	let instance = components.get(element);

	// Fallback for ID or CSS selector string passing
	if (!instance && typeof element === "string") {
		element = resolveElement(element);
		instance = element && components.get(element);
	}

	// Not mounted yet: a pending data-mount="visible"/"idle" or lazy import() must not mount later
	if (!instance && element && typeof element === "object") {
		cancelDeferredMount(element);
	}

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
		components.delete(element);

		// The instance holds a reference to the element ("this.element").
		// We must break this link so the Garbage Collector can free both objects.
		if (instance.element) {
			instance.element = null;
		}
	}
}
