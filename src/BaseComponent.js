import config from "./config.js";
import { queryAll, toggleClass, addClass, removeClass } from "./utils.js";
import { components } from "./store.js";
import { enqueueSetState, flushStateChanges, cleanupComponentState } from "./state.js";
import { loadScript, loadStyle } from "./loaders.js";
import { autoBindActions } from "./actions.js";
import eventbus from "./eventbus.js";
import { GIA_COMPONENT } from "./brand.js";
import {
	observeScroll,
	unobserveScroll,
	observeWindowResize,
	unobserveWindowResize,
	observeResize,
	unobserveResize,
	observeIntersection,
	unobserveIntersection,
	observeMediaQuery,
	unobserveMediaQuery,
	cleanupComponentObservers,
} from "./observers.js";

const globalExcludedMethods = {
	has(name) {
		return name in BaseComponent.prototype || name === "require";
	},
};

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
		this._activeListeners = null;
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
		this._refSchema = items;
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
				// ⚡ BOLT OPTIMIZATION: Fast path pointer check bypasses closest() DOM traversal
				if (element.parentElement !== this.element) {
					const closest = element.closest(`[${componentAttrName}]`);
					// If the ref is inside a descendant component, ignore it unless explicitly prefixed for this component
					if (closest !== this.element && !refName.startsWith(namePrefix)) {
						continue;
					}
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
			// Rebuild from scratch so updateRefs() picks up added/removed elements.
			// "Name:ref" (prefixed for this component) wins over a plain "ref" of the same name,
			// matching the precedence used when a ref schema is declared.
			const refs = {};
			for (const refName in refsByName) {
				const colonIndex = refName.indexOf(":");
				if (colonIndex !== -1) {
					if (refName.substring(0, colonIndex) === this._name) {
						refs[refName.substring(colonIndex + 1)] = refsByName[refName];
					}
				} else if (!refsByName[namePrefix + refName]) {
					refs[refName] = refsByName[refName];
				}
			}
			this._ref = refs;
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

		// Inspect matching data-[key] or g-[key] HTML attributes
		const attrOptions = {};
		if (defaults && typeof defaults === "object") {
			const attrPrefix = config.get("attrPrefix");
			for (const key in defaults) {
				if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;
				const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
				let attrVal = this.element.getAttribute(`${attrPrefix}-${kebabKey}`);
				if (attrVal === null && attrPrefix !== "data") {
					attrVal = this.element.getAttribute(`data-${kebabKey}`);
				}
				if (attrVal !== null) {
					if (attrVal === "true" || (attrVal === "" && typeof defaults[key] === "boolean")) {
						attrOptions[key] = true;
					} else if (attrVal === "false") {
						attrOptions[key] = false;
					} else if (attrVal !== "" && !isNaN(Number(attrVal))) {
						attrOptions[key] = Number(attrVal);
					} else {
						attrOptions[key] = attrVal;
					}
				}
			}
		}

		this._options = {
			...this._options,
			...defaults,
			...attrOptions,
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
			try {
				this._mountCleanup = this.mount();
			} catch (err) {
				console.error(`Gia: Error in mount for "${this._name}".`, err);
			}
		}
	}

	/**
	 * Tears the instance down. Part of the cross-bundle lifecycle protocol (name is reserved
	 * from mangling), so it may be called by another Gia bundle on the page.
	 * @param {boolean} [skipUnmount] - true when the instance never finished constructing
	 */
	_destroy(skipUnmount) {
		this._isMounted = false;
		this._isDestroyed = true;

		if (this._abortController) {
			this._abortController.abort();
		}

		if (this._activeListeners) {
			for (let i = 0; i < this._activeListeners.length; i += 4) {
				const target = this._activeListeners[i];
				const event = this._activeListeners[i + 1];
				const handler = this._activeListeners[i + 2];
				const opts = this._activeListeners[i + 3];
				if (target && typeof target.removeEventListener === "function") {
					target.removeEventListener(event, handler, opts);
				}
			}
			this._activeListeners = null;
		}

		if (typeof this._mountCleanup === "function") {
			try {
				this._mountCleanup();
			} catch (err) {
				console.error(`Gia: Error in mount cleanup for "${this._name}".`, err);
			}
			this._mountCleanup = null;
		}

		if (!skipUnmount) {
			try {
				this.unmount();
			} catch (err) {
				console.error(`Gia: Error in unmount for "${this._name}".`, err);
			}
		}

		cleanupComponentState(this);
		cleanupComponentObservers(this);

		if (this._boundActions) {
			for (let i = 0; i < this._boundActions.length; i += 3) {
				const handler =
					typeof this._boundActions[i + 2] === "function"
						? this._boundActions[i + 2]
						: this[this._boundActions[i + 2]];
				this._boundActions[i].removeEventListener(
					this._boundActions[i + 1],
					handler,
				);
				// Drop pending .debounce/.throttle invocations so they never fire on a destroyed instance
				if (handler && typeof handler.cancel === "function") {
					handler.cancel();
				}
			}
			this._boundActions = null;
		}

		// ⚡ BOLT OPTIMIZATION: Aggressively clear refs and element to assist GC
		this._ref = null;
		this._refSchema = null;
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

	observeMediaQuery(query, callback) {
		return observeMediaQuery(this, query, callback);
	}

	unobserveMediaQuery(query, callback = null) {
		unobserveMediaQuery(this, query, callback);
	}

	loadScript(scriptId, globalName) {
		return loadScript(scriptId, globalName);
	}

	loadStyle(styleId) {
		return loadStyle(styleId);
	}

	listen(target, event, handler, options) {
		let el = target;
		let evt = event;
		let fn = handler;
		let opts = options;

		if (typeof target === "string" && typeof event === "function") {
			el = this.element;
			evt = target;
			fn = event;
			opts = handler;
		}

		if (!el || typeof el.addEventListener !== "function" || typeof fn !== "function") {
			return;
		}

		const signal = this.signal;
		let finalOpts;
		if (opts && typeof opts === "object") {
			finalOpts = opts.signal || !signal ? opts : { ...opts, signal };
		} else if (typeof opts === "boolean") {
			finalOpts = signal ? { capture: opts, signal } : opts;
		} else {
			finalOpts = signal ? { signal } : undefined;
		}

		el.addEventListener(evt, fn, finalOpts);

		// The component signal removes the listener on destroy. Only listeners it does not cover
		// (no AbortController, or a caller-supplied signal) need manual bookkeeping.
		const tracked = !signal || !finalOpts || finalOpts.signal !== signal;
		if (tracked) {
			if (!this._activeListeners) {
				this._activeListeners = [];
			}
			this._activeListeners.push(el, evt, fn, finalOpts);
		}

		return () => {
			el.removeEventListener(evt, fn, finalOpts);
			const list = this._activeListeners;
			if (tracked && list) {
				for (let i = 0; i < list.length; i += 4) {
					if (list[i] === el && list[i + 1] === evt && list[i + 2] === fn && list[i + 3] === finalOpts) {
						list.splice(i, 4);
						break;
					}
				}
			}
		};
	}

	delegate(selector, event, handler, options) {
		if (!this.element || !selector) return () => {};
		const method = typeof handler === "function" ? handler : this[handler];
		if (typeof method !== "function") return () => {};

		const isOnce = options && typeof options === "object" ? !!options.once : false;
		let delegatedOpts = options;
		if (isOnce) {
			delegatedOpts = { ...options, once: false };
		}

		let remove = null;
		const delegatedHandler = (e) => {
			const target = e.target && e.target.closest ? e.target.closest(selector) : null;
			if (target && this.element && this.element.contains(target)) {
				if (isOnce && remove) {
					remove();
				}
				e.delegateTarget = target;
				method.call(this, e, target);
			}
		};

		remove = this.listen(this.element, event, delegatedHandler, delegatedOpts);
		return remove;
	}

	find(selector) {
		return this.element ? this.element.querySelector(selector) : null;
	}

	findAll(selector) {
		return this.element ? Array.from(this.element.querySelectorAll(selector)) : [];
	}

	updateRefs() {
		this.ref = this._refSchema || {};
	}

	emit(event, data) {
		eventbus.emit(event, data);
	}

	on(event, handler, options = false) {
		const signal = this.signal;
		let opts = options;
		if (signal) {
			if (typeof options === "object" && options !== null) {
				opts = options.signal ? options : { ...options, signal };
			} else {
				// Boolean shorthand: on(event, handler, true) means "once"
				opts = { once: !!options, signal };
			}
		}
		eventbus.on(event, handler, opts);
	}

	channel(namespace) {
		const prefix = namespace.endsWith(":") ? namespace : `${namespace}:`;
		return {
			emit: (event, data) => {
				this.emit(`${prefix}${event}`, data);
			},
			on: (event, handler, options = false) => {
				this.on(`${prefix}${event}`, handler, options);
			},
			once: (event, handler, options = {}) => {
				const opts = typeof options === "object" && options !== null ? { ...options, once: true } : { once: true };
				this.on(`${prefix}${event}`, handler, opts);
			},
			off: (event, handler) => {
				eventbus.off(`${prefix}${event}`, handler);
			},
		};
	}

	toggleClass(target, className, condition = null) {
		let el = target;
		let cls = className;
		let cond = condition;

		if (
			typeof target === "string" &&
			(typeof className === "boolean" || className === null || className === undefined)
		) {
			el = this.element;
			cls = target;
			cond = className ?? null;
		} else if (typeof target === "string" && typeof className === "string") {
			el = this.find(target);
		}

		if (el) {
			toggleClass(el, cls, cond);
		}
		return el;
	}

	addClass(target, className) {
		return this._classAction(target, className, addClass);
	}

	removeClass(target, className) {
		return this._classAction(target, className, removeClass);
	}

	// (className) targets the root element; (selector, className) a descendant; (node, className) a node
	_classAction(target, className, fn) {
		let el = target;
		let cls = className;
		if (cls === undefined) {
			el = this.element;
			cls = target;
		} else if (typeof target === "string") {
			el = this.find(target);
		}
		if (el) {
			fn(el, cls);
		}
		return el;
	}

	_autoBindFunctions() {
		const proto = Object.getPrototypeOf(this);
		let methods = protoMethodsCache.get(proto);

		if (!methods) {
			methods = [];
			// Walk the whole prototype chain (B extends A extends Component) so inherited methods
			// are bound too. The most-derived definition of a name decides whether it is a method,
			// so a getter overriding an inherited method is never invoked here.
			const seen = new Set();
			let current = proto;
			while (current && current !== BaseComponent.prototype && current !== Object.prototype) {
				const names = Object.getOwnPropertyNames(current);
				// ⚡ BOLT OPTIMIZATION: Avoid Array.filter to eliminate closure allocation on component init
				for (let i = 0; i < names.length; i++) {
					const method = names[i];
					if (seen.has(method)) continue;
					seen.add(method);
					if (
						!globalExcludedMethods.has(method) &&
						!method.startsWith("_") &&
						typeof Object.getOwnPropertyDescriptor(current, method)?.value === "function"
					) {
						methods.push(method);
					}
				}
				current = Object.getPrototypeOf(current);
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

// Non-enumerable brand used by loadComponents to tell Gia component classes apart from
// arbitrary functions (see brand.js).
Object.defineProperty(BaseComponent.prototype, GIA_COMPONENT, { value: true });
