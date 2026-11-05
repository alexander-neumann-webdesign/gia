import config from "./config.js";
import { constructInstance } from "./createInstance.js";
import { queryAll } from "./utils.js";
import { components as storeComponents } from "./store.js";
import { isComponentClass } from "./brand.js";
import { deferMount, hasDeferredMount, cancelDeferredMount } from "./deferredMount.js";

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

/**
 * Resolves a data-component name to a constructor or loader.
 *
 * The component name comes from markup, so it must never select arbitrary functions:
 * - Entries of the developer-supplied registry may be classes, factories, or lazy loaders,
 *   but values inherited from Object.prototype ("constructor", "toString", ...) are ignored.
 * - The window fallback only accepts Gia component classes. Anything else on window
 *   (setTimeout, stop, print, site or library globals) is never called.
 */
function _resolveComponent(components, name) {
	if (!name) return null;
	if (components) {
		const ctor = components[name];
		if (typeof ctor === "function" && ctor !== Object.prototype[name]) {
			return ctor;
		}
	}
	if (typeof window !== "undefined") {
		let globalCtor;
		try {
			globalCtor = window[name];
		} catch (_e) {
			// Some window getters throw (e.g. storage access in sandboxed frames)
			return null;
		}
		if (isComponentClass(globalCtor)) {
			return globalCtor;
		}
	}
	return null;
}

function _instantiateOrLoad(element, componentName, ctor, components, initialisedComponents) {
	// Already mounted (possibly by another bundle) or a deferred mount is in flight.
	// Repeated loadComponents() calls (manual, autoMount, Swup...) must not start a second one.
	if (storeComponents.has(element) || hasDeferredMount(element)) return;

	if (initialisedComponents) {
		const mountAttr =
			element.getAttribute(`${config.get("attrPrefix")}-mount`) ||
			element.getAttribute("data-mount");

		if (mountAttr === "visible" || mountAttr === "idle") {
			deferMount(element, mountAttr, () => {
				if (element.isConnected) {
					_instantiateOrLoad(element, componentName, ctor, components, null);
				}
			});
			return;
		}
	}

	function _initInstance(cls) {
		// constructInstance returns an existing instance for duplicates; never _load() it twice
		if (storeComponents.has(element)) return null;
		const instance = constructInstance(element, componentName, cls);
		if (instance) {
			if (initialisedComponents) {
				initialisedComponents.push(instance);
			} else {
				instance._load();
			}
		}
		return instance;
	}

	let isClass = isComponentClass(ctor);
	if (
		!isClass &&
		ctor.prototype &&
		(ctor.prototype.mount !== undefined ||
			ctor.prototype._load !== undefined ||
			ctor.prototype.stateChange !== undefined ||
			Function.prototype.toString.call(ctor).startsWith("class "))
	) {
		isClass = true;
	}

	if (isClass) {
		_initInstance(ctor);
		return;
	}

	let result;
	try {
		result = ctor(element);
	} catch (_err) {
		_initInstance(ctor);
		return;
	}

	if ((typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) && result && typeof result.then === "function") {
		let mod;
		const mountLoaded = deferMount(element, null, () => {
			if (!element.isConnected || storeComponents.has(element)) return;
			const Resolved =
				(mod && mod.__esModule && mod.default) || mod?.default || mod?.[componentName] || mod;
			if (typeof Resolved === "function") {
				components[componentName] = Resolved;
				const inst = constructInstance(element, componentName, Resolved);
				if (inst) {
					inst._load();
				}
			}
		});
		result.then(
			(loaded) => {
				mod = loaded;
				mountLoaded(); // no-op when the element's components were removed meanwhile
			},
			(err) => {
				cancelDeferredMount(element, mountLoaded);
				console.error(`Gia: Failed to lazy load component "${componentName}".`, err);
			},
		);
	} else if (typeof result === "function") {
		components[componentName] = result;
		_initInstance(result);
	}
}

// ⚡ BOLT OPTIMIZATION: fast-failing for...in emptiness check, no Object.keys() allocation
function _hasKeys(obj) {
	for (const _k in obj) return true;
	return false;
}

/** Queues one [data-component] element for mounting. Returns 1 if its component resolved. */
function _processElement(element, attrName, components, initialisedComponents) {
	if (storeComponents.has(element)) return 1;
	const componentName = element.getAttribute(attrName);
	const ctor = _resolveComponent(components, componentName);
	if (!ctor) {
		console.warn(`Constructor "${componentName}" not found.`);
		return 0;
	}
	_instantiateOrLoad(element, componentName, ctor, components, initialisedComponents);
	return 1;
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

	// Support calling loadComponents(contextElement)
	if (components && (components.nodeType === 1 || components.nodeType === 9)) {
		context = components;
		components = null;
	}

	// Fall back to the global registry if components was omitted or empty
	if (!_hasKeys(components)) {
		components = (typeof window !== "undefined" && window.gia && window.gia.components) || {};
	}

	_loadRoots(components, [context]);
}

/**
 * Mounts the components inside several roots (and the roots themselves) as one batch, so
 * priority ordering applies across all of them. Used by autoMount for a whole mutation batch.
 * @param {object} components - component registry (empty: the global registry)
 * @param {Element[]} roots - connected elements; nested or repeated roots are fine
 */
export function loadComponentsIn(components, roots) {
	if (!_hasKeys(components)) {
		components = (typeof window !== "undefined" && window.gia && window.gia.components) || {};
	}
	_loadRoots(components, roots);
}

function _loadRoots(components, roots) {
	const initialisedComponents = [];
	const attrName = `${config.get("attrPrefix")}-component`;
	let resolved = 0;

	for (let r = 0; r < roots.length; r++) {
		const context = roots[r];
		const elements = queryAll(`[${attrName}]`, context);
		// ⚡ BOLT OPTIMIZATION: Plain loop over the NodeList, no per-call closure allocation
		for (let i = 0; i < elements.length; i++) {
			resolved += _processElement(elements[i], attrName, components, initialisedComponents);
		}
		// The context element itself is mounted after its descendants
		if (context && context.nodeType === 1 && context.hasAttribute(attrName)) {
			resolved += _processElement(context, attrName, components, initialisedComponents);
		}
	}

	if (!resolved && !_hasKeys(components)) {
		console.warn("App has no components");
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
