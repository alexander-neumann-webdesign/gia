import config from "./config.js";
import createInstance from "./createInstance.js";
import getComponentFromElement from "./getComponentFromElement.js";
import { queryAll } from "./utils.js";
import { components as storeComponents } from "./store.js";
import { isComponentClass } from "./brand.js";

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

function _isConnected(element) {
	return element.isConnected !== undefined
		? element.isConnected
		: element.ownerDocument && element.ownerDocument.contains(element);
}

// Elements with a deferred mount (data-mount="visible"/"idle" or a pending lazy import()).
// Repeated loadComponents() calls (manual, autoMount, Swup...) must not start a second one.
const _pending = new WeakSet();

function _mountWhenVisible(element, fn) {
	if (typeof IntersectionObserver === "undefined") {
		fn();
		return;
	}
	const observer = new IntersectionObserver(
		(entries) => {
			for (let i = 0; i < entries.length; i++) {
				if (entries[i].isIntersecting) {
					observer.unobserve(element);
					observer.disconnect();
					fn();
					break;
				}
			}
		},
		{ rootMargin: "200px" },
	);
	observer.observe(element);
}

function _mountWhenIdle(element, fn) {
	const schedule =
		typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
			? window.requestIdleCallback
			: typeof requestIdleCallback === "function"
			? requestIdleCallback
			: (cb) => setTimeout(cb, 50);
	schedule(fn);
}

function _instantiateOrLoad(element, componentName, ctor, components, initialisedComponents) {
	// Already mounted (possibly by another bundle) or a deferred mount is in flight
	if (storeComponents.has(element) || _pending.has(element)) return;

	if (initialisedComponents) {
		const mountAttr =
			element.getAttribute(`${config.get("attrPrefix")}-mount`) ||
			element.getAttribute("data-mount");

		if (mountAttr === "visible" || mountAttr === "idle") {
			_pending.add(element);
			const deferred = () => {
				_pending.delete(element);
				if (_isConnected(element)) {
					_instantiateOrLoad(element, componentName, ctor, components, null);
				}
			};
			if (mountAttr === "visible") {
				_mountWhenVisible(element, deferred);
			} else {
				_mountWhenIdle(element, deferred);
			}
			return;
		}
	}

	function _initInstance(cls) {
		// createInstance returns an existing instance for duplicates; never _load() it twice
		if (storeComponents.has(element)) return null;
		const instance = createInstance(element, componentName, cls);
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
		_pending.add(element);
		result
			.then((mod) => {
				_pending.delete(element);
				if (!_isConnected(element) || storeComponents.has(element)) return;
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
				_pending.delete(element);
				console.error(`Gia: Failed to lazy load component "${componentName}".`, err);
			});
	} else if (typeof result === "function") {
		components[componentName] = result;
		_initInstance(result);
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
			if (_resolveComponent(null, elements[i].getAttribute(attrName))) {
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
			const ctor = _resolveComponent(components, componentName);

			if (ctor) {
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
			const ctor = _resolveComponent(components, componentName);

			if (ctor) {
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
