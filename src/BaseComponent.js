import config from "./config.js";
import { queryAll } from "./utils.js";
import { components } from "./store.js";
import { enqueueSetState, flushStateChanges, cleanupComponentState } from "./state.js";
import { loadScript, loadStyle } from "./loaders.js";
import { autoBindActions } from "./actions.js";
import {
	observeScroll,
	unobserveScroll,
	observeWindowResize,
	unobserveWindowResize,
	observeResize,
	unobserveResize,
	observeIntersection,
	unobserveIntersection,
	cleanupComponentObservers,
} from "./observers.js";

const globalExcludedMethods = new Set([
	"constructor",
	"require",
	"mount",
	"unmount",
	"getRef",
	"setState",
	"stateChange",
	"loadScript",
	"loadStyle",
	"signal",
	"isMounted",
	"observeScroll",
	"unobserveScroll",
	"observeWindowResize",
	"unobserveWindowResize",
	"observeResize",
	"unobserveResize",
	"observeIntersection",
	"unobserveIntersection",
]);

const protoMethodsCache = new WeakMap();

/**
 * Base Component class providing core lifecycle, refs, options, observers, and state.
 */
export default class BaseComponent {
	constructor(element, options) {
		this.element = element;
		components.set(this.element, this);
		this._name = this.constructor.name;
		this._ref = {};
		this._options = options || {};
		this._state = {};
		this._isMounted = false;
		this._isDestroyed = false;
		this._abortController = null;
		this._mountCleanup = null;
		this._flushStateChanges = this._flushStateChanges.bind(this);
		this._autoBindFunctions();

		if ((typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) && config.get("autoBindActions")) {
			autoBindActions(this, globalExcludedMethods);
		}
	}

	get isMounted() {
		return this._isMounted;
	}

	get signal() {
		if (!this._abortController) {
			const ControllerClass =
				(typeof window !== "undefined" && window.AbortController) ||
				(typeof AbortController !== "undefined" ? AbortController : null);
			if (ControllerClass) {
				this._abortController = new ControllerClass();
				if (this._isDestroyed) {
					this._abortController.abort();
				}
			}
		}
		return this._abortController ? this._abortController.signal : null;
	}

	get ref() {
		return this._ref;
	}

	set ref(items) {
		const attrPrefix = config.get("attrPrefix");
		const attrName = `${attrPrefix}-ref`;
		const componentAttrName = `${attrPrefix}-component`;
		const allRefs = queryAll(`[${attrName}]`, this.element);

		// 🛡️ SECURITY: Prevent DOM DoS / Prototype Pollution by using Object.create(null)
		const refsByName = Object.create(null);

		// Fast-check if there are any nested components inside this element
		const hasNestedComponents = this.element.querySelector(`[${componentAttrName}]`) !== null;
		const namePrefix = `${this._name}:`;

		// ⚡ BOLT OPTIMIZATION: Avoid double lookup by caching the array reference
		for (let i = 0; i < allRefs.length; i++) {
			const element = allRefs[i];
			const refName = element.getAttribute(attrName);
			if (!refName) continue;

			if (hasNestedComponents) {
				const closest = element.closest(`[${componentAttrName}]`);
				// If the ref is inside a descendant component, ignore it unless explicitly prefixed for this component
				if (closest !== this.element && !refName.startsWith(namePrefix)) {
					continue;
				}
			}

			let list = refsByName[refName];
			if (list === undefined) {
				list = [];
				refsByName[refName] = list;
			}
			list.push(element);
		}

		// ⚡ BOLT OPTIMIZATION: Check if object is empty using a fast-failing for...in loop
		// This avoids allocating an array with Object.keys() every time set ref is called
		let itemsEmpty = true;
		for (const _k in items) {
			itemsEmpty = false;
			break;
		}

		if (itemsEmpty) {
			for (const refName in refsByName) {
				const colonIndex = refName.indexOf(":");
				if (colonIndex !== -1) {
					const componentName = refName.substring(0, colonIndex);
					const actualRefName = refName.substring(colonIndex + 1);
					if (componentName === this._name && !this._ref[actualRefName]) {
						this._ref[actualRefName] = refsByName[refName];
					}
				} else {
					if (!this._ref[refName]) {
						this._ref[refName] = refsByName[refName];
					}
				}
			}
		} else {
			this._ref = {};
			// ⚡ BOLT OPTIMIZATION: Use for...in to avoid allocating an array with Object.keys()
			for (const key in items) {
				if (!Object.prototype.hasOwnProperty.call(items, key)) continue;
				const isArray = Array.isArray(items[key]);

				if (items[key] !== null && isArray && items[key].length > 0) {
					this._ref[key] = items[key];
					continue;
				}

				const prefixedName = `${this._name}:${key}`;
				let refs = refsByName[prefixedName] || [];

				if (refs.length === 0) {
					refs = refsByName[key] || [];
				}

				this._ref[key] = isArray ? refs : (refs[0] ?? null);
			}
		}
	}

	get options() {
		return this._options;
	}

	set options(defaults) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) {
			this._options = { ...this._options, ...defaults };
			return;
		}
		const optionsFromAttribute = this.element.getAttribute(`${config.get("attrPrefix")}-options`);
		let options = {};
		if (optionsFromAttribute) {
			// ⚡ BOLT OPTIMIZATION: Avoid JSON.parse in try/catch if it's clearly not JSON
			const trimmedStr = optionsFromAttribute.trim();
			if (trimmedStr.startsWith("{") || trimmedStr.startsWith("[")) {
				try {
					options = JSON.parse(trimmedStr);
				} catch (e) {
					console.error(`Failed to parse options for component "${this._name}": ${e.message}`);
				}
			}
		}

		this._options = {
			...this._options,
			...defaults,
			...options,
		};
	}

	get state() {
		return this._state;
	}

	set state(state) {
		console.warn("Use setState instead.");
		this._state = state;
	}

	_load() {
		if (this.element && !this._isDestroyed) {
			this._isMounted = true;
			this._mountCleanup = this.mount();
		}
	}

	_destroy() {
		this._isMounted = false;
		this._isDestroyed = true;

		if (this._abortController) {
			this._abortController.abort();
		}

		if (typeof this._mountCleanup === "function") {
			try {
				this._mountCleanup();
			} catch (err) {
				console.error(`Gia: Error in mount cleanup for "${this._name}".`, err);
			}
			this._mountCleanup = null;
		}

		try {
			this.unmount();
		} catch (err) {
			console.error(`Gia: Error in unmount for "${this._name}".`, err);
		}

		cleanupComponentState(this);
		cleanupComponentObservers(this);

		if (this._boundActions) {
			for (let i = 0; i < this._boundActions.length; i += 3) {
				this._boundActions[i].removeEventListener(
					this._boundActions[i + 1],
					this[this._boundActions[i + 2]],
				);
			}
			this._boundActions = null;
		}

		// ⚡ BOLT OPTIMIZATION: Aggressively clear refs and element to assist GC
		this._ref = null;
		if (this.element) {
			components.delete(this.element);
			this.element = null;
		}
	}

	mount() {
		// Implemented by component subclasses
	}

	unmount() {
		// Implemented by component subclasses
	}

	getRef(ref, prefixed = false) {
		return `[${config.get("attrPrefix")}-ref="${prefixed ? `${this._name}:` : ""}${ref}"]`;
	}

	setState(changes) {
		enqueueSetState(this, changes);
	}

	_flushStateChanges() {
		flushStateChanges(this);
	}

	stateChange(stateChanges) {
		return stateChanges;
	}

	observeScroll(callback) {
		observeScroll(this, callback);
	}

	unobserveScroll(callback) {
		unobserveScroll(this, callback);
	}

	observeWindowResize(callback) {
		observeWindowResize(this, callback);
	}

	unobserveWindowResize(callback) {
		unobserveWindowResize(this, callback);
	}

	observeResize(element, callback) {
		observeResize(this, element, callback);
	}

	unobserveResize(element, callback = null) {
		unobserveResize(this, element, callback);
	}

	observeIntersection(element, callback, options = {}) {
		observeIntersection(this, element, callback, options);
	}

	unobserveIntersection(element, callback = null) {
		unobserveIntersection(this, element, callback);
	}

	loadScript(scriptId, globalName) {
		return loadScript(scriptId, globalName);
	}

	loadStyle(styleId) {
		return loadStyle(styleId);
	}

	_autoBindFunctions() {
		const proto = Object.getPrototypeOf(this);
		let methods = protoMethodsCache.get(proto);

		if (!methods) {
			methods = [];
			const allMethods = Object.getOwnPropertyNames(proto);
			// ⚡ BOLT OPTIMIZATION: Avoid Array.filter to eliminate closure allocation on component init
			for (let i = 0; i < allMethods.length; i++) {
				const method = allMethods[i];
				if (
					!globalExcludedMethods.has(method) &&
					!method.startsWith("_") &&
					typeof Object.getOwnPropertyDescriptor(proto, method)?.value === "function"
				) {
					methods.push(method);
				}
			}
			protoMethodsCache.set(proto, methods);
		}

		// Bind the cached methods to the instance
		for (let i = 0; i < methods.length; i++) {
			const method = methods[i];
			this[method] = this[method].bind(this);
		}
	}
}
