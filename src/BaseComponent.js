import config from "./config.js";
import { queryAll } from "./utils.js";


let globalScrollListenerBound = false;
let globalResizeListenerBound = false;
const scrollCallbacks = new Set();
const isMobileBrowser = typeof navigator !== 'undefined' && !!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const resizeEventName = isMobileBrowser ? 'orientationchange' : 'resize';
const windowResizeCallbacks = new Set();
let globalLenisInstance = null;
let lastScrollY = 0;
let lastVelocity = 0;


const _scrollPayload = { scroll: 0, velocity: 0 };
const _resizePayload = { width: 0, height: 0 };
const _observerEntryArr = [null];

const _callScrollCb = (cb) => cb(_scrollPayload);
const _callResizeCb = (cb) => cb(_resizePayload);
const _callObserverCb = (cb) => cb(_observerEntryArr);

const _unobserveResizeCb = function(value, element) { this.unobserveResize(element); };
const _unobserveIntersectionCb = function(value, element) { this.unobserveIntersection(element); };

const _flushComponentState = (comp) => comp._flushStateChanges();
let isRafQueued = false;
const dirtyComponents = new Set();

function flushGlobalStateChanges() {
	isRafQueued = false;
	// ⚡ BOLT OPTIMIZATION: Process all dirty components in a single requestAnimationFrame
	dirtyComponents.forEach(_flushComponentState);
	dirtyComponents.clear();
}

function _processScroll() {
	scrollCallbacks.forEach(_callScrollCb);
}

function handleGlobalScroll(e) {
	// ⚡ BOLT OPTIMIZATION: Read layout synchronously OUTSIDE requestAnimationFrame to prevent layout thrashing
	let scrollY, velocity;
	if (globalLenisInstance) {
		scrollY = globalLenisInstance.scroll;
		velocity = globalLenisInstance.velocity;
	} else if (e && typeof e.scroll === 'number') {
		scrollY = e.scroll;
		velocity = e.velocity || 0;
	} else {
		scrollY = window.scrollY || window.pageYOffset;
		velocity = 0; // Native scroll lacks reliable instant velocity
	}

	lastScrollY = scrollY;
	lastVelocity = velocity;

	_scrollPayload.scroll = scrollY;
	_scrollPayload.velocity = velocity;

	_processScroll();
}

function _processResize() {
	windowResizeCallbacks.forEach(_callResizeCb);
}

function handleGlobalResize(e) {
	// ⚡ BOLT OPTIMIZATION: Read layout synchronously OUTSIDE requestAnimationFrame to prevent layout thrashing
	_resizePayload.width = window.innerWidth;
	_resizePayload.height = window.innerHeight;

	_processResize();
}

let globalResizeObserver = null;
const resizeCallbacks = new Map();

const intersectionObservers = new Map(); // optionsHash -> { observer, callbacks }

const globalExcludedMethods = new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript", "loadStyle"]);
const protoMethodsCache = new WeakMap();
const globalStateAttributeCache = new Map();

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
		this._flushStateChanges = this._flushStateChanges.bind(this);
		this._autoBindFunctions();
		if ((typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) && config.get("autoBindActions")) {
			this._autoBindActions();
	}
	}

	get ref() {
		return this._ref;
	}

	set ref(items) {
		const attrName = `${config.get("attrPrefix")}-ref`;
		const allRefs = queryAll(`[${attrName}]`, this.element);

		// 🛡️ SECURITY: Prevent DOM DoS / Prototype Pollution by using Object.create(null)
		const refsByName = Object.create(null);
		// ⚡ BOLT OPTIMIZATION: Avoid double lookup by caching the array reference
		for (let i = 0; i < allRefs.length; i++) {
			const element = allRefs[i];
			const refName = element.getAttribute(attrName);
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

		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) {
			this._ref = null;
			if (this.element) {
				this.element.__gia_component__ = null;
				this.element = null;
			}
			return;
		}

		if (this._observedScrollCallbacks) {
			this._observedScrollCallbacks.forEach(this.unobserveScroll, this);
		}

		if (this._observedWindowResizeCallbacks) {
			this._observedWindowResizeCallbacks.forEach(this.unobserveWindowResize, this);
		}

		if (this._observedResizeElements) {
			// ⚡ BOLT OPTIMIZATION: Use hoisted callback with thisArg to prevent closure allocation
			this._observedResizeElements.forEach(_unobserveResizeCb, this);
		}

		if (this._observedIntersectionElements) {
			// ⚡ BOLT OPTIMIZATION: Use hoisted callback with thisArg to prevent closure allocation
			this._observedIntersectionElements.forEach(_unobserveIntersectionCb, this);
		}

		// ⚡ BOLT OPTIMIZATION: Aggressively clear refs and element to assist GC
		this._ref = null;
		if (this.element) {
			this.element.__gia_component__ = null;
			this.element = null;
		}
	}



	observeScroll(callback) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
		if (typeof window === "undefined") return;

		if (!globalScrollListenerBound) {
			globalScrollListenerBound = true;
			// Lazy check for lenis to hook into its raf scroll
			if (window.lenis) {
				globalLenisInstance = window.lenis;
				globalLenisInstance.on('scroll', handleGlobalScroll);
	} else {
				window.addEventListener('scroll', handleGlobalScroll, { passive: true });
	}
	}

		if (!this._observedScrollCallbacks) {
			this._observedScrollCallbacks = new Set();
	}
		this._observedScrollCallbacks.add(callback);
		scrollCallbacks.add(callback);
	}

	unobserveScroll(callback) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
		if (this._observedScrollCallbacks) {
			this._observedScrollCallbacks.delete(callback);
	}
		scrollCallbacks.delete(callback);

		if (scrollCallbacks.size === 0 && globalScrollListenerBound) {
			globalScrollListenerBound = false;
			if (globalLenisInstance) {
				globalLenisInstance.off('scroll', handleGlobalScroll);
				globalLenisInstance = null;
	} else {
				window.removeEventListener('scroll', handleGlobalScroll);
	}
	}
	}

	observeWindowResize(callback) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
		if (typeof window === "undefined") return;

		if (!globalResizeListenerBound) {
			globalResizeListenerBound = true;
			window.addEventListener(resizeEventName, handleGlobalResize, { passive: true });
	}

		if (!this._observedWindowResizeCallbacks) {
			this._observedWindowResizeCallbacks = new Set();
	}
		this._observedWindowResizeCallbacks.add(callback);
		windowResizeCallbacks.add(callback);
	}

	unobserveWindowResize(callback) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
		if (this._observedWindowResizeCallbacks) {
			this._observedWindowResizeCallbacks.delete(callback);
	}
		windowResizeCallbacks.delete(callback);

		if (windowResizeCallbacks.size === 0 && globalResizeListenerBound) {
			globalResizeListenerBound = false;
			window.removeEventListener(resizeEventName, handleGlobalResize);
	}
	}

	observeResize(element, callback) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
		if (typeof window === "undefined" || !window.ResizeObserver) return;

		if (!globalResizeObserver) {
			globalResizeObserver = new ResizeObserver((entries) => {
				// ⚡ BOLT OPTIMIZATION: Avoid Array.forEach closure allocations in high-frequency callbacks
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i];
			const callbacks = resizeCallbacks.get(entry.target);
			if (callbacks) {
						_observerEntryArr[0] = entry;
						callbacks.forEach(_callObserverCb);
	}
		}
	});
	}

		let rCbs = resizeCallbacks.get(element);
		if (!rCbs) {
			rCbs = new Set();
			resizeCallbacks.set(element, rCbs);
			globalResizeObserver.observe(element);
	}
		rCbs.add(callback);

		if (!this._observedResizeElements) {
			this._observedResizeElements = new Map();
	}
		let oCbs = this._observedResizeElements.get(element);
		if (!oCbs) {
			oCbs = new Set();
			this._observedResizeElements.set(element, oCbs);
	}
		oCbs.add(callback);
	}

	unobserveResize(element, callback = null) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
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
				// ⚡ BOLT OPTIMIZATION: Pass Set.prototype.delete directly to prevent closure allocation
				componentCallbacks.forEach(Set.prototype.delete, globalCbs);
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
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
		if (typeof window === "undefined" || !window.IntersectionObserver) return;

		const hash = getIntersectionOptionsHash(options);
		let observerData = intersectionObservers.get(hash);

		if (!observerData) {
			const observer = new IntersectionObserver((entries) => {
				// ⚡ BOLT OPTIMIZATION: Avoid Array.forEach closure allocations in high-frequency callbacks
				for (let i = 0; i < entries.length; i++) {
					const entry = entries[i];
			const callbacks = observerData.callbacks.get(entry.target);
			if (callbacks) {
						_observerEntryArr[0] = entry;
						callbacks.forEach(_callObserverCb);
	}
		}
	}, options);
			observerData = { observer, callbacks: new Map() };
			intersectionObservers.set(hash, observerData);
	}

		let oDataCbs = observerData.callbacks.get(element);
		if (!oDataCbs) {
			oDataCbs = new Set();
			observerData.callbacks.set(element, oDataCbs);
			observerData.observer.observe(element);
	}
		oDataCbs.add(callback);

		if (!this._observedIntersectionElements) {
			this._observedIntersectionElements = new Map();
	}
		let componentElementMap = this._observedIntersectionElements.get(element);
		if (!componentElementMap) {
			componentElementMap = new Map();
			this._observedIntersectionElements.set(element, componentElementMap);
	}

		let hashCbs = componentElementMap.get(hash);
		if (!hashCbs) {
			hashCbs = new Set();
			componentElementMap.set(hash, hashCbs);
	}
		hashCbs.add(callback);
	}

	_processIntersectionHash(componentCallbacks, hash) {
		const observerData = intersectionObservers.get(hash);
		const element = this._currentUnobserveElement;
		const callback = this._currentUnobserveCallback;

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
				// ⚡ BOLT OPTIMIZATION: Pass Set.prototype.delete directly to prevent closure allocation
				componentCallbacks.forEach(Set.prototype.delete, globalCbs);
			}
			componentCallbacks.clear();
		}

		if (componentCallbacks.size === 0) {
			this._observedIntersectionElements.get(element).delete(hash);
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
	}

	unobserveIntersection(element, callback = null) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
		if (!this._observedIntersectionElements) return;

		const componentElementMap = this._observedIntersectionElements.get(element);
		if (!componentElementMap) return;

		// ⚡ BOLT OPTIMIZATION: Avoid inline closure allocation by storing context
		// and using a bound or class method to process the Map entries.
		this._currentUnobserveElement = element;
		this._currentUnobserveCallback = callback;
		componentElementMap.forEach(this._processIntersectionHash, this);
		this._currentUnobserveElement = null;
		this._currentUnobserveCallback = null;

		if (componentElementMap.size === 0) {
			this._observedIntersectionElements.delete(element);
		}
	}

	/**
	 * Loads a script that is already defined in the DOM with a data-src attribute.
	 * Prevents double-loading and handles race conditions.
	 * @param {string} scriptId - The exact ID of the script tag
	 * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
	 * @return {Promise}
	 */
	loadScript(scriptId, globalName) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return Promise.resolve();
		// SAFETY CHECK: Is the library already active globally?
		// If 'window.multipleSelect' exists, we don't need to do anything.
		if (globalName && window[globalName] && !(window[globalName] instanceof Node) && !(window[globalName] instanceof HTMLCollection) && !(window[globalName] instanceof Window)) {
			return Promise.resolve(window[globalName]);
	}

		// 2. DOM LOOKUP: Find the existing script tag
		const script = document.getElementById(scriptId);
		if (!script) {
			return Promise.reject(new Error(`Script tag with ID '${scriptId}' not found.`));
	}

		// SECURITY: Ensure the found element is actually a script tag to prevent DOM Clobbering
		// and unintended execution of malicious payloads (e.g., via iframe data-src).
		if (!(script instanceof HTMLScriptElement)) {
			return Promise.reject(new Error(`Element with ID '${scriptId}' is not a valid script tag.`));
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
			if (!script.src && script.hasAttribute('data-src')) {
				script.src = script.getAttribute('data-src');
				// Clean up the data attribute to keep DOM tidy (optional)
				script.removeAttribute('data-src');
	} else if (!script.src && !script.hasAttribute('data-src')) {
				// Edge case: Tag exists but has no source at all
				cleanup();
				reject(new Error(`Script tag '${scriptId}' has no src or data-src.`));
	}
	});

		return script._loadPromise;
	}

	/**
	 * Loads a stylesheet that is already defined in the DOM with a data-href attribute.
	 * Prevents double-loading and handles race conditions.
	 * @param {string} styleId - The exact ID of the link tag
	 * @return {Promise}
	 */
	loadStyle(styleId) {
		if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return Promise.resolve();
		// DOM LOOKUP: Find the existing link tag
		const link = document.getElementById(styleId);
		if (!link) {
			return Promise.reject(new Error(`Link tag with ID '${styleId}' not found.`));
	}

		// SECURITY: Ensure the found element is actually a link tag
		if (!(link instanceof HTMLLinkElement)) {
			return Promise.reject(new Error(`Element with ID '${styleId}' is not a valid link tag.`));
	}

		// CACHE CHECK: Did we already start loading this?
		if (link._loadPromise) {
			return link._loadPromise;
	}

		// START LOADING
		link._loadPromise = new Promise((resolve, reject) => {
			// Define cleanup to avoid memory leaks
			const cleanup = () => {
				link.onload = null;
				link.onerror = null;
	};

			link.onload = () => {
				cleanup();
				resolve(true);
	};

			link.onerror = () => {
				cleanup();
				// Delete the promise so we can try again later if needed
				delete link._loadPromise;
				reject(new Error(`Failed to load style: ${styleId}`));
	};

			// TRIGGER: Move data-href to href if not already done
			if (!link.href && link.hasAttribute('data-href')) {
				link.href = link.getAttribute('data-href');
				// Clean up the data attribute to keep DOM tidy (optional)
				link.removeAttribute('data-href');
	} else if (!link.href && !link.hasAttribute('data-href')) {
				// Edge case: Tag exists but has no source at all
				cleanup();
				reject(new Error(`Link tag '${styleId}' has no href or data-href.`));
	} else if (link.href && !link.hasAttribute('data-href')) {
				// Already has href (might be pre-loaded)
				// The onload event might have already fired, but we're attaching it now.
				// If the stylesheet is already loaded, `onload` will not fire again.
				// However, if we reach here and it's already loaded, we assume it's done.
				// We can check if it's already in the styleSheets list.
				let isLoaded = false;
				for (let i = 0; i < document.styleSheets.length; i++) {
					if (document.styleSheets[i].href === link.href) {
						isLoaded = true;
						break;
	}
		}
				if (isLoaded) {
					cleanup();
					resolve(true);
		}
	}
	});

		return link._loadPromise;
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
		// ⚡ BOLT OPTIMIZATION: Process attribute changes and build _pendingStateChanges
		// inside the primary validation loop to avoid allocating an intermediate `stateChanges`
		// object and iterating twice over the keys.
		// ⚡ BOLT OPTIMIZATION: Use for...in to avoid allocating an array with Object.keys()
		if (changes) {
			for (const key in changes) {
				if (!Object.prototype.hasOwnProperty.call(changes, key)) continue;
			const newValue = changes[key];
			if (this._state[key] !== newValue) {
				this._state[key] = newValue;

		if (!this._pendingStateChanges) {
					this._pendingStateChanges = this._reusableStateChanges || {};
					this._pendingAttributeChanges = this._reusableAttributeChanges || {};
					// ⚡ BOLT OPTIMIZATION: Add to global dirty set instead of queuing separate rAF per component
					dirtyComponents.add(this);
					if (!isRafQueued) {
						isRafQueued = true;
						requestAnimationFrame(flushGlobalStateChanges);
					}
		}

				// Build batched state change payload
				this._pendingStateChanges[key] = newValue;

				if (typeof __GIA_NANO__ === "undefined" || !__GIA_NANO__) {
					// Process state changes for attributes
					const type = typeof newValue;
					if (type === "boolean" || type === "string") {
						let attrName = globalStateAttributeCache.get(key);
						if (!attrName) {
							// Convert camelCase to kebab-case
							const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
							attrName = `data-${kebabKey}`;
							globalStateAttributeCache.set(key, attrName);
						}

						this._pendingAttributeChanges[attrName] = type === "boolean" ? (newValue ? "true" : "false") : newValue;
					}
				}
	}
	}
	}
	}

	_flushStateChanges() {
		if (typeof __GIA_NANO__ === "undefined" || !__GIA_NANO__) {
			// Apply batched attribute changes
			// ⚡ BOLT OPTIMIZATION: Fast-failing for...in empty check to avoid Object.keys() array allocation
			// when no attributes changed (common in hot paths like games or parallax).
			let hasAttrChanges = false;
			for (const _k in this._pendingAttributeChanges) {
				hasAttrChanges = true;
				break;
			}

			if (hasAttrChanges) {
				// ⚡ BOLT OPTIMIZATION: Use for...in to avoid allocating an array with Object.keys()
				for (const attrName in this._pendingAttributeChanges) {
					if (!Object.prototype.hasOwnProperty.call(this._pendingAttributeChanges, attrName)) continue;
					const value = this._pendingAttributeChanges[attrName];
					if (this.element.getAttribute(attrName) !== value) {
						this.element.setAttribute(attrName, value);
					}
				}
			}
		}

		this.stateChange(this._pendingStateChanges);

		// ⚡ BOLT OPTIMIZATION: Clear and reuse objects to prevent GC allocation spikes
		this._reusableStateChanges = this._pendingStateChanges;
		this._reusableAttributeChanges = this._pendingAttributeChanges;
		
		for (const k in this._reusableStateChanges) {
			delete this._reusableStateChanges[k];
		}
		
		if (this._reusableAttributeChanges) {
			for (const k in this._reusableAttributeChanges) {
				delete this._reusableAttributeChanges[k];
			}
		}

		this._pendingStateChanges = null;
		this._pendingAttributeChanges = null;
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

	_autoBindActions() {
		if (typeof __GIA_MINI__ !== "undefined" && __GIA_MINI__) return;
		// Find all elements with data-action inside this component
		const actionElements = queryAll("[data-action]", this.element);
		const length = actionElements.length;

		// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid NodeList iteration overhead
		for (let i = 0; i < length; i++) {
			const el = actionElements[i];
			const actionString = el.getAttribute('data-action'); // Allow multiple: "click->doX hover->doY"

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
						method = undefined; // Will trigger the warning below
	}

					if (
						this[method] &&
						typeof this[method] === "function" &&
						!method.startsWith("_") &&
						!globalExcludedMethods.has(method)
					) {
				// ⚡ BOLT OPTIMIZATION: Use the pre-bound method directly instead of allocating
						// an inline closure (e => this[method](e)) for every single bound action.
						el.addEventListener(event, this[method]);
	} else {
						console.warn(`Method "${method}" not found, is restricted, or is not a function in component.`);
	}
		}

				startIndex = spaceIndex + 1;
	}
	}
	}
}
