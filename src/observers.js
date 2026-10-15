/**
 * Centralized observers: IntersectionObserver, ResizeObserver, Scroll, and Window Resize.
 * Eliminates duplicate listener overhead and layout thrashing across components.
 */

let globalScrollListenerBound = false;
let globalResizeListenerBound = false;
const scrollCallbacks = [];
const isMobileBrowser =
	typeof navigator !== "undefined" &&
	!!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);
const windowResizeCallbacks = [];
let globalLenisInstance = null;
let lastScrollY = 0;
let lastVelocity = 0;

const _scrollPayload = { scroll: 0, velocity: 0 };
const _resizePayload = { width: 0, height: 0 };
const _observerEntryArr = [null];

const _unobserveResizeCb = function (val, key) {
	unobserveResize(this, key);
};
const _unobserveIntersectionCb = function (val, key) {
	unobserveIntersection(this, key);
};

function _swapAndPop(arr, item) {
	if (!arr) return;
	const idx = arr.indexOf(item);
	if (idx !== -1) {
		arr[idx] = arr[arr.length - 1];
		arr.pop();
	}
}

function _processScroll() {
	for (let i = scrollCallbacks.length - 1; i >= 0; i--) {
		scrollCallbacks[i](_scrollPayload);
	}
}

function handleGlobalScroll(e) {
	// ⚡ BOLT OPTIMIZATION: Read layout synchronously OUTSIDE requestAnimationFrame to prevent layout thrashing
	let scrollY, velocity;
	if (globalLenisInstance) {
		scrollY = globalLenisInstance.scroll;
		velocity = globalLenisInstance.velocity;
	} else if (e && typeof e.scroll === "number") {
		scrollY = e.scroll;
		velocity = e.velocity || 0;
	} else {
		scrollY = window.scrollY || window.pageYOffset;
		velocity = 0;
	}

	lastScrollY = scrollY;
	lastVelocity = velocity;

	_scrollPayload.scroll = scrollY;
	_scrollPayload.velocity = velocity;

	_processScroll();
}

function _processResize() {
	for (let i = windowResizeCallbacks.length - 1; i >= 0; i--) {
		windowResizeCallbacks[i](_resizePayload);
	}
}

function handleGlobalResize() {
	// ⚡ BOLT OPTIMIZATION: Read layout synchronously OUTSIDE requestAnimationFrame to prevent layout thrashing
	_resizePayload.width = window.innerWidth;
	_resizePayload.height = window.innerHeight;

	_processResize();
}

let globalResizeObserver = null;
const resizeCallbacks = new WeakMap();
const intersectionObservers = new Map(); // root -> marginMap

function getIntersectionObserverData(options) {
	const root = options.root || null;
	const rootMargin = options.rootMargin || "0px 0px 0px 0px";
	const threshold = options.threshold || 0;

	let rootMap = intersectionObservers.get(root);
	if (!rootMap) {
		rootMap = new Map();
		intersectionObservers.set(root, rootMap);
	}

	let marginMap = rootMap.get(rootMargin);
	if (!marginMap) {
		marginMap = new Map();
		rootMap.set(rootMargin, marginMap);
	}

	let currentMap = marginMap;

	if (Array.isArray(threshold)) {
		let lenMap = currentMap.get("array");
		if (!lenMap) {
			lenMap = new Map();
			currentMap.set("array", lenMap);
		}
		currentMap = lenMap;
		for (let i = 0; i < threshold.length; i++) {
			const t = threshold[i];
			let nextMap = currentMap.get(t);
			if (!nextMap) {
				nextMap = new Map();
				currentMap.set(t, nextMap);
			}
			currentMap = nextMap;
		}
	} else {
		let numMap = currentMap.get("number");
		if (!numMap) {
			numMap = new Map();
			currentMap.set("number", numMap);
		}
		currentMap = numMap;
		let nextMap = currentMap.get(threshold);
		if (!nextMap) {
			nextMap = new Map();
			currentMap.set(threshold, nextMap);
		}
		currentMap = nextMap;
	}

	let observerData = currentMap.get("data");
	if (!observerData) {
		const observer = new IntersectionObserver((entries) => {
			// ⚡ BOLT OPTIMIZATION: Avoid Array.forEach closure allocations in high-frequency callbacks
			for (let i = 0; i < entries.length; i++) {
				const entry = entries[i];
				const callbacks = observerData._callbacks.get(entry.target);
				if (callbacks) {
					_observerEntryArr[0] = entry;
					for (let j = callbacks.length - 1; j >= 0; j--) {
						callbacks[j](_observerEntryArr);
					}
				}
			}
		}, options);

		observerData = {
			_observer: observer,
			_callbacks: new WeakMap(),
			_nodeMap: currentMap,
			_elementsCount: 0,
		};
		currentMap.set("data", observerData);
	}

	return observerData;
}

export function observeScroll(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined") return;

	if (!globalScrollListenerBound) {
		globalScrollListenerBound = true;
		if (window.lenis) {
			globalLenisInstance = window.lenis;
			globalLenisInstance.on("scroll", handleGlobalScroll);
		} else {
			window.addEventListener("scroll", handleGlobalScroll, { passive: true });
		}
	}

	if (!instance._observedScrollCallbacks) {
		instance._observedScrollCallbacks = [];
	}
	if (instance._observedScrollCallbacks.indexOf(callback) === -1) {
		instance._observedScrollCallbacks.push(callback);
	}
	if (scrollCallbacks.indexOf(callback) === -1) {
		scrollCallbacks.push(callback);
	}
}

export function unobserveScroll(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (instance && instance._observedScrollCallbacks) {
		_swapAndPop(instance._observedScrollCallbacks, callback);
	}
	_swapAndPop(scrollCallbacks, callback);

	if (scrollCallbacks.length === 0 && globalScrollListenerBound) {
		globalScrollListenerBound = false;
		if (globalLenisInstance) {
			globalLenisInstance.off("scroll", handleGlobalScroll);
			globalLenisInstance = null;
		} else {
			window.removeEventListener("scroll", handleGlobalScroll);
		}
	}
}

export function observeWindowResize(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined") return;

	if (!globalResizeListenerBound) {
		globalResizeListenerBound = true;
		window.addEventListener("resize", handleGlobalResize, { passive: true });
		if (isMobileBrowser) {
			window.addEventListener("orientationchange", handleGlobalResize, { passive: true });
		}
	}

	if (!instance._observedWindowResizeCallbacks) {
		instance._observedWindowResizeCallbacks = [];
	}
	if (instance._observedWindowResizeCallbacks.indexOf(callback) === -1) {
		instance._observedWindowResizeCallbacks.push(callback);
	}
	if (windowResizeCallbacks.indexOf(callback) === -1) {
		windowResizeCallbacks.push(callback);
	}
}

export function unobserveWindowResize(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (instance && instance._observedWindowResizeCallbacks) {
		_swapAndPop(instance._observedWindowResizeCallbacks, callback);
	}
	_swapAndPop(windowResizeCallbacks, callback);

	if (windowResizeCallbacks.length === 0 && globalResizeListenerBound) {
		globalResizeListenerBound = false;
		window.removeEventListener("resize", handleGlobalResize);
		if (isMobileBrowser) {
			window.removeEventListener("orientationchange", handleGlobalResize);
		}
	}
}

export function observeResize(instance, element, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined" || !window.ResizeObserver) return;

	if (!globalResizeObserver) {
		globalResizeObserver = new ResizeObserver((entries) => {
			for (let i = 0; i < entries.length; i++) {
				const entry = entries[i];
				const callbacks = resizeCallbacks.get(entry.target);
				if (callbacks) {
					_observerEntryArr[0] = entry;
					for (let j = callbacks.length - 1; j >= 0; j--) {
						callbacks[j](_observerEntryArr);
					}
				}
			}
		});
	}

	let rCbs = resizeCallbacks.get(element);
	if (!rCbs) {
		rCbs = [];
		resizeCallbacks.set(element, rCbs);
		globalResizeObserver.observe(element);
	}
	if (rCbs.indexOf(callback) === -1) {
		rCbs.push(callback);
	}

	if (!instance._observedResizeElements) {
		instance._observedResizeElements = new Map();
	}
	let oCbs = instance._observedResizeElements.get(element);
	if (!oCbs) {
		oCbs = [];
		instance._observedResizeElements.set(element, oCbs);
	}
	if (oCbs.indexOf(callback) === -1) {
		oCbs.push(callback);
	}
}

export function unobserveResize(instance, element, callback = null) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (!instance._observedResizeElements) return;

	const componentCallbacks = instance._observedResizeElements.get(element);
	if (!componentCallbacks) return;

	if (callback) {
		_swapAndPop(componentCallbacks, callback);
		_swapAndPop(resizeCallbacks.get(element), callback);
	} else {
		const globalCbs = resizeCallbacks.get(element);
		if (globalCbs) {
			for (let i = 0; i < componentCallbacks.length; i++) {
				_swapAndPop(globalCbs, componentCallbacks[i]);
			}
		}
		componentCallbacks.length = 0;
	}

	if (componentCallbacks.length === 0) {
		instance._observedResizeElements.delete(element);
	}

	const globalCbs = resizeCallbacks.get(element);
	if (globalCbs && globalCbs.length === 0) {
		resizeCallbacks.delete(element);
		if (globalResizeObserver) {
			globalResizeObserver.unobserve(element);
		}
	}
}

export function observeIntersection(instance, element, callback, options = {}) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined" || !window.IntersectionObserver) return;

	let actualCallback = callback;
	if (options && options.once) {
		actualCallback = (entries) => {
			for (let i = 0; i < entries.length; i++) {
				if (entries[i].isIntersecting) {
					unobserveIntersection(instance, element, actualCallback);
					break;
				}
			}
			callback(entries);
		};
		actualCallback._wrapped = callback;
	}

	const cleanOptions = options && options.once ? { ...options, once: undefined } : options;
	const observerData = getIntersectionObserverData(cleanOptions);

	let oDataCbs = observerData._callbacks.get(element);
	if (!oDataCbs) {
		oDataCbs = [];
		observerData._callbacks.set(element, oDataCbs);
		observerData._observer.observe(element);
		observerData._elementsCount++;
	}
	if (oDataCbs.indexOf(actualCallback) === -1) {
		oDataCbs.push(actualCallback);
	}

	if (!instance._observedIntersectionElements) {
		instance._observedIntersectionElements = new Map();
	}
	let componentElementMap = instance._observedIntersectionElements.get(element);
	if (!componentElementMap) {
		componentElementMap = new Map();
		instance._observedIntersectionElements.set(element, componentElementMap);
	}

	let obsCbs = componentElementMap.get(observerData);
	if (!obsCbs) {
		obsCbs = [];
		componentElementMap.set(observerData, obsCbs);
	}
	if (obsCbs.indexOf(actualCallback) === -1) {
		obsCbs.push(actualCallback);
	}
}

function _processIntersectionData(instance, element, callback, componentCallbacks, observerData) {
	if (callback) {
		let idx = componentCallbacks.indexOf(callback);
		if (idx === -1) {
			for (let i = 0; i < componentCallbacks.length; i++) {
				if (componentCallbacks[i]._wrapped === callback) {
					idx = i;
					break;
				}
			}
		}
		if (idx !== -1) {
			const targetCb = componentCallbacks[idx];
			componentCallbacks[idx] = componentCallbacks[componentCallbacks.length - 1];
			componentCallbacks.pop();
			if (observerData && observerData._callbacks.has(element)) {
				_swapAndPop(observerData._callbacks.get(element), targetCb);
			}
		}
	} else {
		if (observerData && observerData._callbacks.has(element)) {
			const globalCbs = observerData._callbacks.get(element);
			for (let i = 0; i < componentCallbacks.length; i++) {
				_swapAndPop(globalCbs, componentCallbacks[i]);
			}
		}
		componentCallbacks.length = 0;
	}

	if (componentCallbacks.length === 0) {
		instance._observedIntersectionElements.get(element).delete(observerData);
	}

	if (observerData) {
		const globalCbs = observerData._callbacks.get(element);
		if (globalCbs && globalCbs.length === 0) {
			observerData._callbacks.delete(element);
			observerData._observer.unobserve(element);
			observerData._elementsCount--;
		}

		if (observerData._elementsCount === 0) {
			observerData._observer.disconnect();
			if (observerData._nodeMap) {
				observerData._nodeMap.delete("data");
			}
		}
	}
}

export function unobserveIntersection(instance, element, callback = null) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (!instance._observedIntersectionElements) return;

	const componentElementMap = instance._observedIntersectionElements.get(element);
	if (!componentElementMap) return;

	// ⚡ BOLT OPTIMIZATION: Use Map.forEach with hoisted callback to prevent Iterator array allocation in for...of loops.
	componentElementMap.forEach((componentCallbacks, observerData) => {
		_processIntersectionData(instance, element, callback, componentCallbacks, observerData);
	});

	if (componentElementMap.size === 0) {
		instance._observedIntersectionElements.delete(element);
	}
}

const mediaQueryLists = new Map(); // query -> { mql, callbacks: [], handler }

export function observeMediaQuery(instance, query, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return () => {};
	if (typeof window === "undefined" || !window.matchMedia) return () => {};

	let item = mediaQueryLists.get(query);
	if (!item) {
		const mql = window.matchMedia(query);
		const callbacks = [];
		const handler = (e) => {
			const matches = e.matches;
			for (let i = callbacks.length - 1; i >= 0; i--) {
				callbacks[i](matches, e);
			}
		};

		if (mql.addEventListener) {
			mql.addEventListener("change", handler);
		} else if (mql.addListener) {
			mql.addListener(handler);
		}

		item = { _mql: mql, _callbacks: callbacks, _handler: handler };
		mediaQueryLists.set(query, item);
	}

	if (item._callbacks.indexOf(callback) === -1) {
		item._callbacks.push(callback);
	}

	if (!instance._observedMediaQueries) {
		instance._observedMediaQueries = new Map();
	}
	let compCbs = instance._observedMediaQueries.get(query);
	if (!compCbs) {
		compCbs = [];
		instance._observedMediaQueries.set(query, compCbs);
	}
	if (compCbs.indexOf(callback) === -1) {
		compCbs.push(callback);
	}

	// Trigger immediately with initial match state
	try {
		callback(item._mql.matches, item._mql);
	} catch (e) {
		console.error(e);
	}

	const unobserve = () => {
		unobserveMediaQuery(instance, query, callback);
	};

	if (instance.signal) {
		instance.signal.addEventListener("abort", unobserve, { once: true });
	}

	return unobserve;
}

export function unobserveMediaQuery(instance, query, callback = null) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	const item = mediaQueryLists.get(query);
	if (!item) return;

	if (instance && instance._observedMediaQueries) {
		const compCbs = instance._observedMediaQueries.get(query);
		if (compCbs) {
			if (callback) {
				const idx = compCbs.indexOf(callback);
				if (idx !== -1) {
					compCbs.splice(idx, 1);
				}
			} else {
				compCbs.length = 0;
			}
			if (compCbs.length === 0) {
				instance._observedMediaQueries.delete(query);
			}
		}
	}

	if (callback) {
		const idx = item._callbacks.indexOf(callback);
		if (idx !== -1) {
			item._callbacks.splice(idx, 1);
		}
	} else if (instance && instance._observedMediaQueries) {
		const compCbs = instance._observedMediaQueries.get(query);
		if (compCbs) {
			for (let i = 0; i < compCbs.length; i++) {
				const idx = item._callbacks.indexOf(compCbs[i]);
				if (idx !== -1) {
					item._callbacks.splice(idx, 1);
				}
			}
		}
	}

	if (item._callbacks.length === 0) {
		if (item._mql.removeEventListener) {
			item._mql.removeEventListener("change", item._handler);
		} else if (item._mql.removeListener) {
			item._mql.removeListener(item._handler);
		}
		mediaQueryLists.delete(query);
	}
}

/**
 * Cleans up all observers registered by a component instance during unmount.
 * @param {object} instance - Component instance
 */
export function cleanupComponentObservers(instance) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;

	if (instance._observedScrollCallbacks) {
		for (let i = instance._observedScrollCallbacks.length - 1; i >= 0; i--) {
			unobserveScroll(instance, instance._observedScrollCallbacks[i]);
		}
		instance._observedScrollCallbacks = null;
	}

	if (instance._observedWindowResizeCallbacks) {
		for (let i = instance._observedWindowResizeCallbacks.length - 1; i >= 0; i--) {
			unobserveWindowResize(instance, instance._observedWindowResizeCallbacks[i]);
		}
		instance._observedWindowResizeCallbacks = null;
	}

	if (instance._observedResizeElements) {
		// ⚡ BOLT OPTIMIZATION: Use Map.forEach with hoisted callback to prevent Iterator array allocation in for...of loops.
		instance._observedResizeElements.forEach(_unobserveResizeCb, instance);
		instance._observedResizeElements = null;
	}

	if (instance._observedIntersectionElements) {
		// ⚡ BOLT OPTIMIZATION: Use Map.forEach with hoisted callback to prevent Iterator array allocation in for...of loops.
		instance._observedIntersectionElements.forEach(_unobserveIntersectionCb, instance);
		instance._observedIntersectionElements = null;
	}

	if (instance._observedMediaQueries) {
		instance._observedMediaQueries.forEach((callbacks, query) => {
			for (let i = callbacks.length - 1; i >= 0; i--) {
				unobserveMediaQuery(instance, query, callbacks[i]);
			}
		});
		instance._observedMediaQueries = null;
	}
}
