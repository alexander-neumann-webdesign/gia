import { components } from "./store.js";

/**
 * Return instance from element
 * @param element: DOM element or ID of element
 * @returns component instance
 */

export default function getComponentFromElement(element) {
	if (typeof element === "string" && typeof document !== "undefined") {
		const el = document.getElementById(element);
		if (el) {
			element = el;
		} else if (typeof document.querySelector === "function") {
			try {
				element = document.querySelector(element);
			} catch (_e) {
				return null;
			}
		} else {
			return null;
		}

		if (!element) {
			return null;
		}
	}

	return components.get(element) || null;
}
