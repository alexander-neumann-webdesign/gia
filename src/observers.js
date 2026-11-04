/**
 * Centralized observers: Scroll, Window Resize, ResizeObserver, IntersectionObserver and
 * matchMedia. Eliminates duplicate listener overhead and layout thrashing across components.
 *
 * Every feature is a "registry": a shared map of key -> callbacks (key is window, an element,
 * or a media query), with `start(key)` run when the first callback for a key arrives and
 * `stop(key)` when the last one leaves. Each component instance records what it registered in
 * instance._obs (Map registry -> Map key -> callbacks), so a single generic routine handles
 * per-component unobserving and teardown for all features.
 */

const isMobileBrowser =
	typeof navigator !== "undefined" &&
	!!navigator.userAgent.match(/(Android|iPod|iPhone|iPad|BlackBerry|IEMobile|Opera Mini)/i);

// ⚡ BOLT OPTIMIZATION: payload objects and the single-entry array are reused on every
// dispatch, so high-frequency callbacks (scroll, resize) allocate nothing.
const _scrollPayload = { scroll: 0, velocity: 0 };
const _resizePayload = { width: 0, height: 0 };
const _entryArr = [null];

function _swapAndPop(arr, item) {
	if (!arr) return;
	const idx = arr.indexOf(item);
	if (idx !== -1) {
		arr[idx] = arr[arr.length - 1];
		arr.pop();
	}
}

function _addOnce(arr, item) {
	if (arr.indexOf(item) === -1) arr.push(item);
}

// Callbacks run in reverse so a callback may unobserve itself during dispatch (swap-and-pop)
function _dispatch(cbs, arg, arg2) {
	if (!cbs) return;
	for (let i = cbs.length - 1; i >= 0; i--) {
		cbs[i](arg, arg2);
	}
}

/**
 * @param {Function} start - (key) => void, first callback registered for key
 * @param {Function} stop - (key) => void, last callback removed for key
 * @param {boolean} [weak] - key callbacks by element in a WeakMap
 */
function _registry(start, stop, weak) {
	return { _cbs: weak ? new WeakMap() : new Map(), _start: start, _stop: stop };
}

function _observe(instance, reg, key, cb) {
	let cbs = reg._cbs.get(key);
	if (!cbs) {
		cbs = [];
		reg._cbs.set(key, cbs);
		reg._start(key);
	}
	_addOnce(cbs, cb);

	const mine = instance._obs || (instance._obs = new Map());
	let perKey = mine.get(reg);
	if (!perKey) {
		perKey = new Map();
		mine.set(reg, perKey);
	}
	let list = perKey.get(key);
	if (!list) {
		list = [];
		perKey.set(key, list);
	}
	_addOnce(list, cb);
}

/** Removes `cb` (or, when omitted, all of this instance's callbacks) for `key` in `reg`. */
function _unobserve(instance, reg, key, cb) {
	const perKey = instance && instance._obs && instance._obs.get(reg);
	const list = perKey && perKey.get(key);
	if (!list) return;
	const cbs = reg._cbs.get(key);

	if (cb) {
		for (let i = 0; i < list.length; i++) {
			// _wrapped: an internal wrapper (observeIntersection once) registered for `cb`
			if (list[i] === cb || list[i]._wrapped === cb) {
				_swapAndPop(cbs, list[i]);
				list[i] = list[list.length - 1];
				list.pop();
				break;
			}
		}
	} else {
		for (let i = 0; i < list.length; i++) {
			_swapAndPop(cbs, list[i]);
		}
		list.length = 0;
	}

	if (list.length === 0) {
		perKey.delete(key);
		if (perKey.size === 0) instance._obs.delete(reg);
	}
	if (cbs && cbs.length === 0) {
		reg._cbs.delete(key);
		reg._stop(key);
	}
}

// ─── Window scroll ──────────────────────────────────────────────────────────

let globalLenisInstance = null;

function handleGlobalScroll(e) {
	// ⚡ BOLT OPTIMIZATION: Read layout synchronously OUTSIDE requestAnimationFrame to prevent layout thrashing
	if (globalLenisInstance) {
		_scrollPayload.scroll = globalLenisInstance.scroll;
		_scrollPayload.velocity = globalLenisInstance.velocity;
	} else if (e && typeof e.scroll === "number") {
		_scrollPayload.scroll = e.scroll;
		_scrollPayload.velocity = e.velocity || 0;
	} else {
		_scrollPayload.scroll = window.scrollY || window.pageYOffset;
		_scrollPayload.velocity = 0;
	}
	_dispatch(scrollRegistry._cbs.get(window), _scrollPayload);
}

const scrollRegistry = _registry(
	() => {
		if (window.lenis) {
			globalLenisInstance = window.lenis;
			globalLenisInstance.on("scroll", handleGlobalScroll);
		} else {
			window.addEventListener("scroll", handleGlobalScroll, { passive: true });
		}
	},
	() => {
		if (globalLenisInstance) {
			globalLenisInstance.off("scroll", handleGlobalScroll);
			globalLenisInstance = null;
		} else {
			window.removeEventListener("scroll", handleGlobalScroll);
		}
	},
);

export function observeScroll(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined") return;
	_observe(instance, scrollRegistry, window, callback);
}

export function unobserveScroll(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined") return;
	_unobserve(instance, scrollRegistry, window, callback);
}

// ─── Window resize ──────────────────────────────────────────────────────────

function handleGlobalResize() {
	// ⚡ BOLT OPTIMIZATION: Read layout synchronously OUTSIDE requestAnimationFrame to prevent layout thrashing
	_resizePayload.width = window.innerWidth;
	_resizePayload.height = window.innerHeight;
	_dispatch(windowResizeRegistry._cbs.get(window), _resizePayload);
}

const windowResizeRegistry = _registry(
	() => {
		window.addEventListener("resize", handleGlobalResize, { passive: true });
		if (isMobileBrowser) {
			window.addEventListener("orientationchange", handleGlobalResize, { passive: true });
		}
	},
	() => {
		window.removeEventListener("resize", handleGlobalResize);
		if (isMobileBrowser) {
			window.removeEventListener("orientationchange", handleGlobalResize);
		}
	},
);

export function observeWindowResize(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined") return;
	_observe(instance, windowResizeRegistry, window, callback);
}

export function unobserveWindowResize(instance, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined") return;
	_unobserve(instance, windowResizeRegistry, window, callback);
}

// ─── Element observers (ResizeObserver / IntersectionObserver) ──────────────

// Routes native observer entries to the callbacks registered for each entry's target
function _entryDispatcher(getReg) {
	return (entries) => {
		// ⚡ BOLT OPTIMIZATION: Avoid Array.forEach closure allocations in high-frequency callbacks
		const reg = getReg();
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			const cbs = reg._cbs.get(entry.target);
			if (cbs) {
				_entryArr[0] = entry;
				_dispatch(cbs, _entryArr);
			}
		}
	};
}

// One ResizeObserver shared by every element and component
let globalResizeObserver = null;
const resizeRegistry = _registry(
	(el) => globalResizeObserver.observe(el),
	(el) => globalResizeObserver.unobserve(el),
	true,
);

export function observeResize(instance, element, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (typeof window === "undefined" || !window.ResizeObserver) return;
	if (!globalResizeObserver) {
		globalResizeObserver = new ResizeObserver(_entryDispatcher(() => resizeRegistry));
	}
	_observe(instance, resizeRegistry, element, callback);
}

export function unobserveResize(instance, element, callback = null) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	_unobserve(instance, resizeRegistry, element, callback);
}

// IntersectionObservers are pooled per root + rootMargin + threshold: root -> key -> registry
const intersectionPools = new Map();

function _intersectionRegistry(options) {
	const root = options.root || null;
	const threshold = options.threshold || 0;
	// Arrays and numbers get distinct keys: [0.5] and 0.5 are different observer configurations
	const key = `${options.rootMargin || "0px 0px 0px 0px"}|${Array.isArray(threshold) ? `[${threshold}]` : threshold}`;

	let pool = intersectionPools.get(root);
	if (!pool) {
		pool = new Map();
		intersectionPools.set(root, pool);
	}
	let reg = pool.get(key);
	if (!reg) {
		let count = 0;
		const observer = new IntersectionObserver(_entryDispatcher(() => reg), options);
		reg = _registry(
			(el) => {
				count++;
				observer.observe(el);
			},
			(el) => {
				observer.unobserve(el);
				if (--count === 0) {
					// Last element gone: release the observer and drop the pool entries
					observer.disconnect();
					pool.delete(key);
					if (pool.size === 0) intersectionPools.delete(root);
				}
			},
			true,
		);
		reg._intersection = true;
		pool.set(key, reg);
	}
	return reg;
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

	const cleanOptions = options && options.once ? { ...options, once: undefined } : options || {};
	_observe(instance, _intersectionRegistry(cleanOptions), element, actualCallback);
}

const _toRemove = [];

export function unobserveIntersection(instance, element, callback = null) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	if (!instance || !instance._obs) return;
	// The element may be observed through several pooled observers (different options).
	// Collect first: _unobserve deletes from instance._obs while we would be iterating it.
	instance._obs.forEach((perKey, reg) => {
		if (reg._intersection && perKey.has(element)) _toRemove.push(reg);
	});
	for (let i = 0; i < _toRemove.length; i++) {
		_unobserve(instance, _toRemove[i], element, callback);
	}
	_toRemove.length = 0;
}

// ─── Media queries ──────────────────────────────────────────────────────────

const mediaQueryLists = new Map(); // query -> { _mql, _handler }

const mediaQueryRegistry = _registry(
	(query) => {
		const mql = window.matchMedia(query);
		const handler = (e) => _dispatch(mediaQueryRegistry._cbs.get(query), e.matches, e);
		if (mql.addEventListener) {
			mql.addEventListener("change", handler);
		} else if (mql.addListener) {
			mql.addListener(handler);
		}
		mediaQueryLists.set(query, { _mql: mql, _handler: handler });
	},
	(query) => {
		const item = mediaQueryLists.get(query);
		if (item._mql.removeEventListener) {
			item._mql.removeEventListener("change", item._handler);
		} else if (item._mql.removeListener) {
			item._mql.removeListener(item._handler);
		}
		mediaQueryLists.delete(query);
	},
);

export function observeMediaQuery(instance, query, callback) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return () => {};
	if (typeof window === "undefined" || !window.matchMedia) return () => {};

	_observe(instance, mediaQueryRegistry, query, callback);

	// Trigger immediately with initial match state
	const mql = mediaQueryLists.get(query)._mql;
	try {
		callback(mql.matches, mql);
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
	_unobserve(instance, mediaQueryRegistry, query, callback);
}

// ─── Teardown ───────────────────────────────────────────────────────────────

/**
 * Cleans up all observers registered by a component instance during unmount.
 * @param {object} instance - Component instance
 */
export function cleanupComponentObservers(instance) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return;
	const mine = instance._obs;
	if (!mine) return;
	// Snapshot (registry, key) pairs first, since _unobserve mutates instance._obs
	const start = _toRemove.length;
	mine.forEach((perKey, reg) => {
		perKey.forEach((list, key) => _toRemove.push(reg, key));
	});
	for (let i = start; i < _toRemove.length; i += 2) {
		_unobserve(instance, _toRemove[i], _toRemove[i + 1], null);
	}
	_toRemove.length = start;
	instance._obs = null;
}
