import config from "./config.js";
import createInstance from "./createInstance.js";
import getComponentFromElement from "./getComponentFromElement.js";
import { queryAll } from "./utils.js";
import { components as storeComponents } from "./store.js";

/**
 * Creates instances of components without creating duplicates on elements within the context
 * @param components: object of components to load
 * @param context: DOM element
 */

function _comparePriority(a, b) {
	if (!a) return 1;
	if (!b) return -1;
	const pA = a.constructor._gia_priority ?? a.constructor.priority ?? 0;
	const pB = b.constructor._gia_priority ?? b.constructor.priority ?? 0;
	return pB - pA; // Descending order (highest priority first)
}

function _instantiateOrLoad(element, componentName, ctor, components, initialisedComponents) {
	let isClass = false;
	if (
		ctor.prototype &&
		(ctor.prototype.mount !== undefined ||
			ctor.prototype._load !== undefined ||
			ctor.prototype.stateChange !== undefined ||
			Function.prototype.toString.call(ctor).startsWith("class "))
	) {
		isClass = true;
	}

	if (isClass) {
		const instance = createInstance(element, componentName, ctor);
		if (instance) {
			initialisedComponents.push(instance);
		}
		return;
	}

	let result;
	try {
		result = ctor(element);
	} catch (_err) {
		const instance = createInstance(element, componentName, ctor);
		if (instance) {
			initialisedComponents.push(instance);
		}
		return;
	}

	if (result && typeof result.then === "function") {
		result
			.then((mod) => {
				if (!element.isConnected) return;
				const Resolved =
					(mod && mod.__esModule && mod.default) || mod?.default || mod?.[componentName] || mod;
				if (typeof Resolved === "function") {
					components[componentName] = Resolved;
					const inst = createInstance(element, componentName, Resolved);
					if (inst) {
						inst._load();
					}
				}
			})
			.catch((err) => {
				console.error(`Gia: Failed to lazy load component "${componentName}".`, err);
			});
	} else if (typeof result === "function") {
		components[componentName] = result;
		const instance = createInstance(element, componentName, result);
		if (instance) {
			initialisedComponents.push(instance);
		}
	}
}

export default function loadComponents(components = {}, context = document.documentElement) {
	// If invoked in <head> while DOM is still loading, automatically defer to DOMContentLoaded
	if (
		typeof document !== "undefined" &&
		document.readyState === "loading" &&
		context === document.documentElement
	) {
		document.addEventListener(
			"DOMContentLoaded",
			() => {
				loadComponents(components, context);
			},
			{ once: true }
		);
		return;
	}

	let hasComponents = false;

	// Support calling loadComponents(contextElement)
	if (components && (components.nodeType === 1 || components.nodeType === 9)) {
		context = components;
		components = {};
	}

	if (components) {
		// ⚡ BOLT OPTIMIZATION: Check if object is empty using a fast-failing for...in loop
		for (const _k in components) {
			hasComponents = true;
			break;
		}
	}

	// Fallback to global registry if components was omitted or empty
	if (!hasComponents && typeof window !== "undefined" && window.gia?.components) {
		components = window.gia.components;
		for (const _k in components) {
			hasComponents = true;
			break;
		}
	}

	// Fallback to global window constructors if components was omitted or empty
	if (!hasComponents && typeof window !== "undefined") {
		const attrName = `${config.get("attrPrefix")}-component`;
		const elements = queryAll(`[${attrName}]`, context);
		for (let i = 0; i < elements.length; i++) {
			const name = elements[i].getAttribute(attrName);
			if (name && typeof window[name] === "function") {
				hasComponents = true;
				break;
			}
		}
	}

	if (!hasComponents) {
		console.warn("App has no components");
		return;
	}

	const initialisedComponents = [];
	const attrName = `${config.get("attrPrefix")}-component`;

	const elements = queryAll(`[${attrName}]`, context);
	const elementsLength = elements.length;

	// ⚡ BOLT OPTIMIZATION: Inline processElement logic to avoid allocating a closure function
	// and to prevent additional garbage collection overhead per element.
	for (let i = 0; i < elementsLength; i++) {
		const element = elements[i];
		// ⚡ BOLT OPTIMIZATION: Inline getComponentFromElement to avoid function call overhead
		// and string-type checking since we know element is a DOM node.
		const instance = storeComponents.get(element);

		if (!instance) {
			const componentName = element.getAttribute(attrName);
			let ctor = components[componentName];
			if (!ctor && typeof window !== "undefined" && typeof window[componentName] === "function") {
				ctor = window[componentName];
			}

			if (typeof ctor === "function") {
				_instantiateOrLoad(element, componentName, ctor, components, initialisedComponents);
			} else {
				console.warn(`Constructor "${componentName}" not found.`);
			}
		}
	}

	if (context && context.nodeType === 1 && context.hasAttribute(attrName)) {
		// ⚡ BOLT OPTIMIZATION: Inline getComponentFromElement to avoid function call overhead
		const instance = storeComponents.get(context);

		if (!instance) {
			const componentName = context.getAttribute(attrName);
			let ctor = components[componentName];
			if (!ctor && typeof window !== "undefined" && typeof window[componentName] === "function") {
				ctor = window[componentName];
			}

			if (typeof ctor === "function") {
				_instantiateOrLoad(context, componentName, ctor, components, initialisedComponents);
			} else {
				console.warn(`Constructor "${componentName}" not found.`);
			}
		}
	}

	// ⚡ BOLT OPTIMIZATION: Only sort if at least one component defines custom priority.
	// This skips Array.sort() and preserves native DOM order with zero allocation in the common case.
	if (initialisedComponents.length > 1) {
		let hasCustomPriority = false;
		for (let i = 0; i < initialisedComponents.length; i++) {
			const c = initialisedComponents[i];
			if (c && (c.constructor._gia_priority !== undefined || c.constructor.priority !== undefined)) {
				hasCustomPriority = true;
				break;
			}
		}
		if (hasCustomPriority) {
			initialisedComponents.sort(_comparePriority);
		}
	}

	// call _load/require/mount
	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid array iteration overhead
	for (let i = 0; i < initialisedComponents.length; i++) {
		const comp = initialisedComponents[i];
		if (comp) {
			comp._load();
		}
	}
}
