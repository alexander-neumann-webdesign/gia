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
const resizeEventName = isMobileBrowser ? "orientationchange" : "resize";
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
				const callbacks = observerData.callbacks.get(entry.target);
				if (callbacks) {
					_observerEntryArr[0] = entry;
					for (let j = callbacks.length - 1; j >= 0; j--) {
						callbacks[j](_observerEntryArr);
					}
				}
			}
		}, options);

		observerData = {
			observer,
			callbacks: new WeakMap(),
			nodeMap: currentMap,
			elementsCount: 0,
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
		const idx = instance._observedScrollCallbacks.indexOf(callback);
		if (idx !== -1) {
			instance._observedScrollCallbacks[idx] =
				instance._observedScrollCallbacks[instance._observedScrollCallbacks.length - 1];
			instance._observedScrollCallbacks.pop();
		}
	}
	const globalIdx = scrollCallbacks.indexOf(callback);
	if (globalIdx !== -1) {
		scrollCallbacks[globalIdx] = scrollCallbacks[scrollCallbacks.length - 1];
		scrollCallbacks.pop();
	}

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
		window.addEventListener(resizeEventName, handleGlobalResize, { passive: true });
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
		const idx = instance._observedWindowResizeCallbacks.indexOf(callback);
		if (idx !== -1) {
			instance._observedWindowResizeCallbacks[idx] =
				instance._observedWindowResizeCallbacks[instance._observedWindowResizeCallbacks.length - 1];
			instance._observedWindowResizeCallbacks.pop();
		}
	}
	const globalIdx = windowResizeCallbacks.indexOf(callback);
	if (globalIdx !== -1) {
		windowResizeCallbacks[globalIdx] = windowResizeCallbacks[windowResizeCallbacks.length - 1];
		windowResizeCallbacks.pop();
	}

	if (windowResizeCallbacks.length === 0 && globalResizeListenerBound) {
		globalResizeListenerBound = false;
		window.removeEventListener(resizeEventName, handleGlobalResize);
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
		const idx = componentCallbacks.indexOf(callback);
		if (idx !== -1) {
			componentCallbacks[idx] = componentCallbacks[componentCallbacks.length - 1];
			componentCallbacks.pop();
		}
		const globalCbs = resizeCallbacks.get(element);
		if (globalCbs) {
			const gIdx = globalCbs.indexOf(callback);
			if (gIdx !== -1) {
				globalCbs[gIdx] = globalCbs[globalCbs.length - 1];
				globalCbs.pop();
			}
		}
	} else {
		const globalCbs = resizeCallbacks.get(element);
		if (globalCbs) {
			for (let i = 0; i < componentCallbacks.length; i++) {
				const cb = componentCallbacks[i];
				const gIdx = globalCbs.indexOf(cb);
				if (gIdx !== -1) {
					globalCbs[gIdx] = globalCbs[globalCbs.length - 1];
					globalCbs.pop();
				}
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

	const observerData = getIntersectionObserverData(options);

	let oDataCbs = observerData.callbacks.get(element);
	if (!oDataCbs) {
		oDataCbs = [];
		observerData.callbacks.set(element, oDataCbs);
		observerData.observer.observe(element);
		observerData.elementsCount++;
	}
	if (oDataCbs.indexOf(callback) === -1) {
		oDataCbs.push(callback);
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
	if (obsCbs.indexOf(callback) === -1) {
		obsCbs.push(callback);
	}
}

function _processIntersectionData(instance, element, callback, componentCallbacks, observerData) {
	if (callback) {
		const idx = componentCallbacks.indexOf(callback);
		if (idx !== -1) {
			componentCallbacks[idx] = componentCallbacks[componentCallbacks.length - 1];
			componentCallbacks.pop();
			if (observerData && observerData.callbacks.has(element)) {
				const globalCbs = observerData.callbacks.get(element);
				const gIdx = globalCbs.indexOf(callback);
				if (gIdx !== -1) {
					globalCbs[gIdx] = globalCbs[globalCbs.length - 1];
					globalCbs.pop();
				}
			}
		}
	} else {
		if (observerData && observerData.callbacks.has(element)) {
			const globalCbs = observerData.callbacks.get(element);
			for (let i = 0; i < componentCallbacks.length; i++) {
				const cb = componentCallbacks[i];
				const gIdx = globalCbs.indexOf(cb);
				if (gIdx !== -1) {
					globalCbs[gIdx] = globalCbs[globalCbs.length - 1];
					globalCbs.pop();
				}
			}
		}
		componentCallbacks.length = 0;
	}

	if (componentCallbacks.length === 0) {
		instance._observedIntersectionElements.get(element).delete(observerData);
	}

	if (observerData) {
		const globalCbs = observerData.callbacks.get(element);
		if (globalCbs && globalCbs.length === 0) {
			observerData.callbacks.delete(element);
			observerData.observer.unobserve(element);
			observerData.elementsCount--;
		}

		if (observerData.elementsCount === 0) {
			observerData.observer.disconnect();
			if (observerData.nodeMap) {
				observerData.nodeMap.delete("data");
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
}
