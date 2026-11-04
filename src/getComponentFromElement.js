import { components } from "./store.js";

/**
 * Resolves an element ID or CSS selector to an element.
 * @param {string} ref
 * @returns {Element|null}
 */
export function resolveElement(ref) {
	if (typeof document === "undefined") return null;
	const el = document.getElementById(ref);
	if (el) return el;
	try {
		return document.querySelector(ref);
	} catch (_e) {
		return null; // invalid selector
	}
}

/**
 * Return instance from element
 * @param element: DOM element, element ID, or CSS selector
 * @returns component instance
 */
export default function getComponentFromElement(element) {
	if (typeof element === "string") {
		element = resolveElement(element);
	}
	return (element && components.get(element)) || null;
}
