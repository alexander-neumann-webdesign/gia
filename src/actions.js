import config from "./config.js";
import { queryAll } from "./utils.js";

function _bindElement(el, isRoot, instance, excludedMethods, hasNestedComponents, componentAttrName, actionAttrName) {
	if (!isRoot && hasNestedComponents) {
		// ⚡ BOLT OPTIMIZATION: Fast path pointer check bypasses closest() DOM traversal
		if (el.parentElement !== instance.element) {
			const closest = el.closest(`[${componentAttrName}]`);
			if (closest !== instance.element) {
				return; // Action belongs to a nested child component
			}
		}
	}

	const actionString = el.getAttribute(actionAttrName) || el.getAttribute("data-action");
	if (!actionString) return;

	let startIndex = 0;
	// ⚡ BOLT OPTIMIZATION: Avoid .split() to prevent intermediate array allocations
	while (startIndex < actionString.length) {
		let spaceIndex = actionString.indexOf(" ", startIndex);
		if (spaceIndex === -1) {
			spaceIndex = actionString.length;
		}

		if (spaceIndex > startIndex) {
			const pair = actionString.substring(startIndex, spaceIndex);
			const arrowIndex = pair.indexOf("->");

			let eventStr, method;
			if (arrowIndex !== -1) {
				eventStr = pair.substring(0, arrowIndex);
				method = pair.substring(arrowIndex + 2);
			} else {
				eventStr = pair;
				method = undefined;
			}

			if (
				instance[method] &&
				typeof instance[method] === "function" &&
				!method.startsWith("_") &&
				!excludedMethods.has(method)
			) {
				let eventName = eventStr;
				let prevent = false;
				let stop = false;
				let once = false;

				if (eventStr.indexOf(".") !== -1) {
					const parts = eventStr.split(".");
					eventName = parts[0];
					for (let p = 1; p < parts.length; p++) {
						const mod = parts[p];
						if (mod === "prevent") prevent = true;
						else if (mod === "stop") stop = true;
						else if (mod === "once") once = true;
					}
				}

				let handler = instance[method];
				if (prevent || stop) {
					handler = function (e) {
						if (prevent && e && typeof e.preventDefault === "function") e.preventDefault();
						if (stop && e && typeof e.stopPropagation === "function") e.stopPropagation();
						return instance[method](e);
					};
				}

				let opts;
				if (once) {
					opts = instance.signal ? { signal: instance.signal, once: true } : { once: true };
				} else {
					opts = instance.signal ? { signal: instance.signal } : undefined;
				}

				el.addEventListener(eventName, handler, opts);

				if (!instance._boundActions) instance._boundActions = [];
				instance._boundActions.push(el, eventName, handler);
			} else {
				console.warn(`Method "${method}" not found, is restricted, or is not a function in component.`);
			}
		}

		startIndex = spaceIndex + 1;
	}
}

/**
 * Parses and binds data-action attributes on elements inside the component.
 * Format: data-action="click->handleClick mouseenter->handleHover"
 * Modifiers: data-action="submit.prevent->handleSubmit click.stop->handleClick click.once->handleOnce"
 * @param {object} instance - The component instance
 * @param {Set} excludedMethods - Set of method names that cannot be bound
 */
export function autoBindActions(instance, excludedMethods) {
	if (typeof __GIA_MINI__ !== "undefined" && __GIA_MINI__) return;

	const attrPrefix = config.get("attrPrefix");
	const componentAttrName = `${attrPrefix}-component`;
	const actionAttrName = `${attrPrefix}-action`;
	const hasNestedComponents = instance.element.querySelector(`[${componentAttrName}]`) !== null;

	// Check if root element itself defines an action
	if (instance.element.hasAttribute(actionAttrName) || instance.element.hasAttribute("data-action")) {
		_bindElement(instance.element, true, instance, excludedMethods, hasNestedComponents, componentAttrName, actionAttrName);
	}

	const actionSelector =
		actionAttrName === "data-action" ? "[data-action]" : `[${actionAttrName}],[data-action]`;
	const actionElements = queryAll(actionSelector, instance.element);
	const length = actionElements.length;

	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid NodeList iteration overhead
	for (let i = 0; i < length; i++) {
		_bindElement(actionElements[i], false, instance, excludedMethods, hasNestedComponents, componentAttrName, actionAttrName);
	}
}
