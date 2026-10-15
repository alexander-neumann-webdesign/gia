import config from "./config.js";
import { queryAll, debounce, throttle } from "./utils.js";

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
			const colonIndex = arrowIndex === -1 ? pair.indexOf(":") : -1;

			let eventStr, method;
			if (arrowIndex !== -1) {
				eventStr = pair.substring(0, arrowIndex);
				method = pair.substring(arrowIndex + 2);
			} else if (colonIndex !== -1) {
				eventStr = pair.substring(0, colonIndex);
				method = pair.substring(colonIndex + 1);
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
				let self = false;
				let outside = false;
				let passive = false;
				let capture = false;
				let debounceWait = null;
				let throttleWait = null;
				let keyFilter = null;

				if (eventStr.indexOf(".") !== -1) {
					const parts = eventStr.split(".");
					eventName = parts[0];
					for (let p = 1; p < parts.length; p++) {
						const mod = parts[p];
						if (mod === "prevent") prevent = true;
						else if (mod === "stop") stop = true;
						else if (mod === "once") once = true;
						else if (mod === "self") self = true;
						else if (mod === "outside") outside = true;
						else if (mod === "passive") passive = true;
						else if (mod === "capture") capture = true;
						else if (mod === "debounce") {
							debounceWait = 200;
							if (p + 1 < parts.length && !isNaN(Number(parts[p + 1]))) {
								debounceWait = Number(parts[p + 1]);
								p++;
							}
						} else if (mod.startsWith("debounce-")) {
							const num = Number(mod.substring(9));
							debounceWait = isNaN(num) ? 200 : num;
						} else if (mod === "throttle") {
							throttleWait = 100;
							if (p + 1 < parts.length && !isNaN(Number(parts[p + 1]))) {
								throttleWait = Number(parts[p + 1]);
								p++;
							}
						} else if (mod.startsWith("throttle-")) {
							const num = Number(mod.substring(9));
							throttleWait = isNaN(num) ? 100 : num;
						} else if (mod === "enter") keyFilter = "Enter";
						else if (mod === "esc" || mod === "escape") keyFilter = "Escape";
						else if (mod === "space") keyFilter = "Space";
						else if (mod === "tab") keyFilter = "Tab";
						else if (mod === "arrow-up" || mod === "up") keyFilter = "ArrowUp";
						else if (mod === "arrow-down" || mod === "down") keyFilter = "ArrowDown";
						else if (mod === "arrow-left" || mod === "left") keyFilter = "ArrowLeft";
						else if (mod === "arrow-right" || mod === "right") keyFilter = "ArrowRight";
					}
				}

				const targetEl = outside && typeof document !== "undefined" ? document : el;

				let handler = instance[method];
				let opts;

				if (prevent || stop || self || outside || keyFilter || (outside && once)) {
					handler = function (e) {
						if (self && e && e.target !== el) return;
						if (outside && e && e.target && el.contains(e.target)) return;
						if (keyFilter && e) {
							const k = e.key;
							if (keyFilter === "Space") {
								if (k !== " " && k !== "Space" && k !== "Spacebar") return;
							} else if (k !== keyFilter) {
								return;
							}
						}
						if (prevent && e && typeof e.preventDefault === "function") e.preventDefault();
						if (stop && e && typeof e.stopPropagation === "function") e.stopPropagation();
						if (outside && once) {
							targetEl.removeEventListener(eventName, handler, opts);
						}
						return instance[method](e);
					};
				}

				if (debounceWait !== null) {
					handler = debounce(handler, debounceWait);
				} else if (throttleWait !== null) {
					handler = throttle(handler, throttleWait);
				}

				const hasOpts = (once && !outside) || passive || capture || instance.signal;
				if (hasOpts) {
					opts = {};
					if (once && !outside) opts.once = true;
					if (passive) opts.passive = true;
					if (capture) opts.capture = true;
					if (instance.signal) opts.signal = instance.signal;
				}

				targetEl.addEventListener(eventName, handler, opts);

				if (!instance._boundActions) instance._boundActions = [];
				instance._boundActions.push(targetEl, eventName, handler);
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
