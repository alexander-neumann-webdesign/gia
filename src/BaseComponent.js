import config from "./config.js";
import { queryAll } from "./utils.js";

let globalResizeObserver = null;
const resizeCallbacks = new Map();

const intersectionObservers = new Map(); // optionsHash -> { observer, callbacks }

const globalExcludedMethods = new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]);
const protoMethodsCache = new WeakMap();

function getIntersectionOptionsHash(options) {
	const root = options.root || null;
	const rootMargin = options.rootMargin || "0px 0px 0px 0px";
	const threshold = options.threshold || 0;
	const thresholdStr = Array.isArray(threshold) ? threshold.join(",") : threshold.toString();

	// Since root is an Element, we can't easily stringify it if it's dynamic.
	// But usually, root is null. If it's an Element, we just give it a unique ID or use a WeakMap.
	// For simplicity in a global hash, if root is present we just use an object reference approach or ignore root serialization if it's always document.
	// Let's create a string hash:
	const rootId = root ? (root.id || "root-element") : "null";
	return `${rootId}|${rootMargin}|${thresholdStr}`;
}

/**
 * Component without code splitting support
 */

export default class Component {
	constructor(element, options) {
		this.element = element;
		this.element.__gia_component__ = this;
		this._name = this.constructor.name;
		this._ref = {};
		this._options = options || {};
		this._state = {};
		this._stateAttributeCache = {};
		this._autoBindFunctions();
		if (config.get("autoBindActions")) {
			this._autoBindActions();
		}
	}

	get ref() {
		return this._ref;
	}

	set ref(items) {
		const attrName = `${config.get("attrPrefix")}-ref`;
		const allRefs = queryAll(`[${attrName}]`, this.element);

		const refsByName = {};
		for (let i = 0; i < allRefs.length; i++) {
			const element = allRefs[i];
			const refName = element.getAttribute(attrName);
			if (!refsByName[refName]) {
				refsByName[refName] = [];
			}
			refsByName[refName].push(element);
		}

		let itemsEmpty = true;
		for (const key in items) {
			if (Object.prototype.hasOwnProperty.call(items, key)) {
				itemsEmpty = false;
				break;
			}
		}

		if (itemsEmpty) {
			for (const refName in refsByName) {
				if (Object.prototype.hasOwnProperty.call(refsByName, refName)) {
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
			}
		} else {
			this._ref = {};
			for (const key in items) {
				if (Object.prototype.hasOwnProperty.call(items, key)) {
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
	}

	get options() {
		return this._options;
	}

	set options(defaults) {
		const optionsFromAttribute = this.element.getAttribute(`${config.get("attrPrefix")}-options`);
		let options = {};
		if (optionsFromAttribute) {
			try {
				options = JSON.parse(optionsFromAttribute);
			} catch (e) {
				console.error(`Failed to parse options for component "${this._name}": ${e.message}`);
			}
		}

		this._options = {
			...this._options,
			...defaults,
			...options,
		};

		// return this._options;
	}

	get state() {
		return this._state;
	}

	set state(state) {
		console.warn("Use setState instead.");
		this._state = state;
	}

	_load() {
		this.mount();
	}

	_destroy() {
		this.unmount();

		if (this._observedResizeElements) {
			for (const element of this._observedResizeElements.keys()) {
				this.unobserveResize(element);
			}
		}

		if (this._observedIntersectionElements) {
			for (const element of this._observedIntersectionElements.keys()) {
				this.unobserveIntersection(element);
			}
		}
	}

	observeResize(element, callback) {
		if (typeof window === "undefined" || !window.ResizeObserver) return;

		if (!globalResizeObserver) {
			globalResizeObserver = new ResizeObserver((entries) => {
				for (const entry of entries) {
					const callbacks = resizeCallbacks.get(entry.target);
					if (callbacks) {
						callbacks.forEach((cb) => cb([entry]));
					}
				}
			});
		}

		if (!resizeCallbacks.has(element)) {
			resizeCallbacks.set(element, new Set());
			globalResizeObserver.observe(element);
		}
		resizeCallbacks.get(element).add(callback);

		if (!this._observedResizeElements) {
			this._observedResizeElements = new Map();
		}
		if (!this._observedResizeElements.has(element)) {
			this._observedResizeElements.set(element, new Set());
		}
		this._observedResizeElements.get(element).add(callback);
	}

	unobserveResize(element, callback = null) {
		if (!this._observedResizeElements) return;

		const componentCallbacks = this._observedResizeElements.get(element);
		if (!componentCallbacks) return;

		if (callback) {
			componentCallbacks.delete(callback);
			const globalCbs = resizeCallbacks.get(element);
			if (globalCbs) globalCbs.delete(callback);
		} else {
			const globalCbs = resizeCallbacks.get(element);
			if (globalCbs) {
				componentCallbacks.forEach((cb) => globalCbs.delete(cb));
			}
			componentCallbacks.clear();
		}

		if (componentCallbacks.size === 0) {
			this._observedResizeElements.delete(element);
		}

		const globalCbs = resizeCallbacks.get(element);
		if (globalCbs && globalCbs.size === 0) {
			resizeCallbacks.delete(element);
			if (globalResizeObserver) {
				globalResizeObserver.unobserve(element);
			}
		}
	}

	observeIntersection(element, callback, options = {}) {
		if (typeof window === "undefined" || !window.IntersectionObserver) return;

		const hash = getIntersectionOptionsHash(options);
		let observerData = intersectionObservers.get(hash);

		if (!observerData) {
			const observer = new IntersectionObserver((entries) => {
				for (const entry of entries) {
					const callbacks = observerData.callbacks.get(entry.target);
					if (callbacks) {
						callbacks.forEach((cb) => cb([entry]));
					}
				}
			}, options);
			observerData = { observer, callbacks: new Map() };
			intersectionObservers.set(hash, observerData);
		}

		if (!observerData.callbacks.has(element)) {
			observerData.callbacks.set(element, new Set());
			observerData.observer.observe(element);
		}
		observerData.callbacks.get(element).add(callback);

		if (!this._observedIntersectionElements) {
			this._observedIntersectionElements = new Map();
		}
		if (!this._observedIntersectionElements.has(element)) {
			this._observedIntersectionElements.set(element, new Map());
		}

		const componentElementMap = this._observedIntersectionElements.get(element);
		if (!componentElementMap.has(hash)) {
			componentElementMap.set(hash, new Set());
		}
		componentElementMap.get(hash).add(callback);
	}

	unobserveIntersection(element, callback = null) {
		if (!this._observedIntersectionElements) return;

		const componentElementMap = this._observedIntersectionElements.get(element);
		if (!componentElementMap) return;

		componentElementMap.forEach((componentCallbacks, hash) => {
			const observerData = intersectionObservers.get(hash);

			if (callback) {
				if (componentCallbacks.has(callback)) {
					componentCallbacks.delete(callback);
					if (observerData && observerData.callbacks.has(element)) {
						observerData.callbacks.get(element).delete(callback);
					}
				}
			} else {
				if (observerData && observerData.callbacks.has(element)) {
					const globalCbs = observerData.callbacks.get(element);
					componentCallbacks.forEach((cb) => globalCbs.delete(cb));
				}
				componentCallbacks.clear();
			}

			if (componentCallbacks.size === 0) {
				componentElementMap.delete(hash);
			}

			if (observerData) {
				const globalCbs = observerData.callbacks.get(element);
				if (globalCbs && globalCbs.size === 0) {
					observerData.callbacks.delete(element);
					observerData.observer.unobserve(element);
				}

				if (observerData.callbacks.size === 0) {
					observerData.observer.disconnect();
					intersectionObservers.delete(hash);
				}
			}
		});

		if (componentElementMap.size === 0) {
			this._observedIntersectionElements.delete(element);
		}
	}

	/**
	 * Loads a script that is already defined in the DOM with a data-src attribute.
	 * Prevents double-loading and handles race conditions.
	 * * @param {string} scriptId - The ID of the script tag (without "-js" suffix)
	 * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
	 * @return {Promise}
	 */
	loadScript(scriptId, globalName) {
		// SAFETY CHECK: Is the library already active globally?
		// If 'window.multipleSelect' exists, we don't need to do anything.
		if (globalName && window[globalName]) {
			return Promise.resolve(window[globalName]);
		}

		// 2. DOM LOOKUP: Find the existing script tag
		const script = document.getElementById(`${scriptId}-js`);
		if (!script) {
			return Promise.reject(new Error(`Script tag with ID '${scriptId}-js' not found.`));
		}

		// CACHE CHECK: Did we already start loading this?
		// If another component triggered this 5ms ago, return that same running promise.
		if (script._loadPromise) {
			return script._loadPromise;
		}

		// START LOADING
		script._loadPromise = new Promise((resolve, reject) => {
			// Define cleanup to avoid memory leaks
			const cleanup = () => {
				script.onload = null;
				script.onerror = null;
			};

			script.onload = () => {
				cleanup();
				resolve(globalName ? window[globalName] : true);
			};

			script.onerror = () => {
				cleanup();
				// Delete the promise so we can try again later if needed
				delete script._loadPromise;
				reject(new Error(`Failed to load script: ${scriptId}`));
			};

			// TRIGGER: Move data-src to src if not already done
			// If script.src is already set, the browser is likely already downloading it.
			// We still attach the listeners above to catch the completion event.
			if (!script.src && script.dataset.src) {
				script.src = script.dataset.src;
				// Clean up the data attribute to keep DOM tidy (optional)
				delete script.dataset.src;
			} else if (!script.src && !script.dataset.src) {
				// Edge case: Tag exists but has no source at all
				cleanup();
				reject(new Error(`Script tag '${scriptId}-js' has no src or data-src.`));
			}
		});

		return script._loadPromise;
	}

	mount() {
		// this is here only to be rewritten
		// console.warn(`Component ${this._name} does not have "mount" method.`);
	}

	unmount() {
		// this is here only to be rewritten
	}

	getRef(ref, prefixed = false) {
		return `[${config.get("attrPrefix")}-ref="${prefixed ? `${this._name}:` : ""}${ref}"]`;
	}

	setState(changes) {
		const stateChanges = {};
		let hasChanges = false;

		for (const key in changes) {
			if (Object.prototype.hasOwnProperty.call(changes, key)) {
				if (this._state[key] !== changes[key]) {
					stateChanges[key] = changes[key];
					this._state[key] = changes[key];
					hasChanges = true;
				}
			}
		}

		if (hasChanges) {
			if (!this._pendingStateChanges) {
				this._pendingStateChanges = {};
				this._pendingAttributeChanges = {};
				requestAnimationFrame(() => {
					// Apply batched attribute changes
					for (const attrName in this._pendingAttributeChanges) {
						if (Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, attrName)) {
							const value = this._pendingAttributeChanges[attrName];
							if (this.element.getAttribute(attrName) !== value) {
								this.element.setAttribute(attrName, value);
							}
						}
					}

					this.stateChange(this._pendingStateChanges);
					this._pendingStateChanges = null;
					this._pendingAttributeChanges = null;
				});
			}

			// Process state changes for attributes
			for (const key in stateChanges) {
				if (Object.prototype.hasOwnProperty.call(stateChanges, key)) {
					const value = stateChanges[key];
					const type = typeof value;

					if (type === "boolean" || type === "string") {
						if (!this._stateAttributeCache[key]) {
							// Convert camelCase to kebab-case
							const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
							this._stateAttributeCache[key] = `data-${kebabKey}`;
						}

						const attrName = this._stateAttributeCache[key];
						this._pendingAttributeChanges[attrName] = type === "boolean" ? (value ? "true" : "false") : value;
					}
				}
			}

			Object.assign(this._pendingStateChanges, stateChanges);
		}
	}

	stateChange(stateChanges) {
		// this is here only to be rewritten
		// console.warn(`Component ${this._name} does not have "stateChange" method.`);
		return stateChanges;
	}

	_autoBindFunctions() {
		const proto = Object.getPrototypeOf(this);
		let methods = protoMethodsCache.get(proto);

		if (!methods) {
			methods = Object.getOwnPropertyNames(proto).filter((method) => {
				return (
					!globalExcludedMethods.has(method) &&
					!method.startsWith("_") &&
					typeof Object.getOwnPropertyDescriptor(proto, method)?.value === "function"
				);
			});
			protoMethodsCache.set(proto, methods);
		}

		// Bind the cached methods to the instance
		for (let i = 0; i < methods.length; i++) {
			const method = methods[i];
			this[method] = this[method].bind(this);
		}
	}

	_autoBindActions() {
		// Find all elements with data-action inside this component
		const actionElements = queryAll("[data-action]", this.element);
		const length = actionElements.length;

		// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid NodeList iteration overhead
		for (let i = 0; i < length; i++) {
			const el = actionElements[i];
			const actionString = el.dataset.action; // Allow multiple: "click->doX hover->doY"

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
						method = undefined; // Will trigger the warning below
					}

					if (this[method]) {
						// Bind the event and ensure 'this' refers to the component instance
						el.addEventListener(event, (e) => this[method](e));
					} else {
						console.warn(`Method "${method}" not found in component.`);
					}
				}

				startIndex = spaceIndex + 1;
			}
		}
	}
}
