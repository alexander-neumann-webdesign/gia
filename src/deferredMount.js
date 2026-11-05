/**
 * Deferred mounts: data-mount="visible" / "idle" and lazy import() loaders that are in flight.
 *
 * Each element with a deferred mount maps to a token, the function that runs it. A token only
 * runs while it is still the one registered for its element, so cancelDeferredMount() (called
 * when the element's components are removed) reliably stops a mount that has not started yet.
 */

const _tokens = new WeakMap(); // element -> token

// ⚡ BOLT OPTIMIZATION: one IntersectionObserver for every data-mount="visible" element, released
// when nothing is waiting any more (instead of one observer per element)
let _visibleObserver = null;
let _visibleCount = 0;

function _onIntersect(entries) {
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		if (!entry.isIntersecting) continue;
		const token = _tokens.get(entry.target);
		if (token && token._visible) token();
	}
}

function _unobserveVisible(element) {
	_visibleObserver.unobserve(element);
	if (--_visibleCount === 0) {
		_visibleObserver.disconnect();
		_visibleObserver = null;
	}
}

function _scheduleIdle(fn) {
	const schedule =
		typeof window !== "undefined" && typeof window.requestIdleCallback === "function"
			? window.requestIdleCallback
			: typeof requestIdleCallback === "function"
			? requestIdleCallback
			: (cb) => setTimeout(cb, 50);
	schedule(fn);
}

/** True while `element` has a deferred mount that has neither run nor been cancelled. */
export function hasDeferredMount(element) {
	return _tokens.has(element);
}

/**
 * Registers a deferred mount for `element` and returns its token.
 * @param {Element} element
 * @param {string|null} mode - "visible" or "idle" start it automatically; otherwise the caller
 *   calls the returned token itself (e.g. once a lazy import() resolves)
 * @param {Function} fn - runs at most once, unless the mount is cancelled first
 * @returns {Function} token
 */
export function deferMount(element, mode, fn) {
	const token = () => {
		if (_tokens.get(element) !== token) return; // cancelled or superseded
		_release(element, token);
		fn();
	};
	_tokens.set(element, token);

	if (mode === "visible") {
		if (typeof IntersectionObserver === "undefined") {
			token();
		} else {
			token._visible = true;
			if (!_visibleObserver) {
				_visibleObserver = new IntersectionObserver(_onIntersect, { rootMargin: "200px" });
			}
			_visibleCount++;
			_visibleObserver.observe(element);
		}
	} else if (mode === "idle") {
		_scheduleIdle(token);
	}
	return token;
}

function _release(element, token) {
	_tokens.delete(element);
	if (token._visible) _unobserveVisible(element);
}

/**
 * Cancels the deferred mount of `element`, if any.
 * @param {Element} element
 * @param {Function} [only] - cancel only if this token is still the registered one
 */
export function cancelDeferredMount(element, only) {
	const token = _tokens.get(element);
	if (token && (!only || token === only)) _release(element, token);
}
