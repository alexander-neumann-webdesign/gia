import config from "./config.js";
import { queryAll } from "./utils.js";

/**
 * Parses and binds data-action attributes on elements inside the component.
 * Format: data-action="click->handleClick mouseenter->handleHover"
 * @param {object} instance - The component instance
 * @param {Set} excludedMethods - Set of method names that cannot be bound
 */
export function autoBindActions(instance, excludedMethods) {
	if (typeof __GIA_MINI__ !== "undefined" && __GIA_MINI__) return;

	const attrPrefix = config.get("attrPrefix");
	const componentAttrName = `${attrPrefix}-component`;
	const actionAttrName = `${attrPrefix}-action`;
	const hasNestedComponents = instance.element.querySelector(`[${componentAttrName}]`) !== null;

	const actionSelector =
		actionAttrName === "data-action" ? "[data-action]" : `[${actionAttrName}],[data-action]`;
	const actionElements = queryAll(actionSelector, instance.element);
	const length = actionElements.length;

	let listenerOpts;

	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid NodeList iteration overhead
	for (let i = 0; i < length; i++) {
		const el = actionElements[i];

		if (hasNestedComponents) {
			const closest = el.closest(`[${componentAttrName}]`);
			if (closest !== instance.element) {
				continue; // Action belongs to a nested child component
			}
		}

		const actionString = el.getAttribute(actionAttrName) || el.getAttribute("data-action");

		if (!actionString) continue;

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

				let event, method;
				if (arrowIndex !== -1) {
					event = pair.substring(0, arrowIndex);
					method = pair.substring(arrowIndex + 2);
				} else {
					event = pair;
					method = undefined;
				}

				if (
					instance[method] &&
					typeof instance[method] === "function" &&
					!method.startsWith("_") &&
					!excludedMethods.has(method)
				) {
					// ⚡ BOLT OPTIMIZATION: Use the pre-bound method directly instead of allocating
					// an inline closure (e => this[method](e)) for every single bound action.
					// Lazily cache listenerOpts to eliminate per-action object allocations.
					if (listenerOpts === undefined) {
						listenerOpts = instance.signal ? { signal: instance.signal } : null;
					}
					el.addEventListener(event, instance[method], listenerOpts || undefined);

					if (!instance._boundActions) instance._boundActions = [];
					instance._boundActions.push(el, event, method);
				} else {
					console.warn(`Method "${method}" not found, is restricted, or is not a function in component.`);
				}
			}

			startIndex = spaceIndex + 1;
		}
	}
}
