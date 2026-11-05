import { nanoUnsupported } from "./nanoUnsupported.js";

/**
 * Dynamic script and stylesheet loaders with DOM clobbering protection and promise caching.
 */

const URL_REGEX = /^(?:https?:|\/\/|\/|\.\.?\/)|(?:\.js|\.css)$/;

/**
 * Finds the tag for an ID. WordPress enqueues assets with the handle plus "-js" / "-css" as the
 * tag ID (wp_enqueue_script("slider") -> <script id="slider-js">), so that ID is tried as well.
 * A suffixed match must be the expected tag type; an unrelated element that merely has the bare
 * ID (e.g. <div id="slider">) does not hide a valid "slider-js" script.
 * @returns {Element|null} the tag, a wrong-typed element with the exact ID (rejected by the
 *   caller as DOM clobbering), or null when nothing matches
 */
function _findById(id, Type, suffix) {
	const exact = document.getElementById(id);
	if (exact instanceof Type) return exact;
	if (typeof id === "string") {
		const suffixed = document.getElementById(id + suffix);
		if (suffixed instanceof Type) return suffixed;
	}
	return exact;
}

/**
 * Detects a script that finished loading before loadScript() first saw it (e.g. a regular
 * <script src> tag, or one enqueued by WordPress), whose load event will never fire again.
 * @param {HTMLScriptElement} el
 * @param {Function} onLoaded
 */
function _whenScriptAlreadyLoaded(el, onLoaded) {
	if (document.readyState === "complete") {
		// Every script in the document when the window load event fired has executed. A tag that
		// other code inserted afterwards may still be in flight: treat it as loaded only once the
		// browser has a finished resource-timing entry for it, otherwise wait for its load event.
		const perf = typeof performance !== "undefined" ? performance : null;
		if (perf && perf.getEntriesByName && perf.getEntriesByName(el.src).length) {
			onLoaded();
		}
	} else {
		// Still loading: the window load event fires only after this script has executed
		window.addEventListener("load", onLoaded);
	}
}

/**
 * Shared implementation for loadScript / loadStyle.
 * @param {string} id - Element ID (also tried with WordPress' "-js"/"-css" suffix), or a URL to
 *   load (an existing tag with that URL is reused)
 * @param {boolean} isScript
 * @param {string} [globalName] - Scripts only: global the script exposes (resolved value)
 */
function _loadAsset(id, isScript, globalName) {
	const tag = isScript ? "script" : "link";
	const attr = isScript ? "src" : "href";
	const label = isScript ? "Script" : "Link";
	const Type = isScript ? HTMLScriptElement : HTMLLinkElement;

	// DOM LOOKUP: Find the existing tag by ID, or by URL, or create it from the URL
	let el = _findById(id, Type, isScript ? "-js" : "-css");
	let created = false;
	if (!el) {
		if (typeof id !== "string" || !URL_REGEX.test(id)) {
			return Promise.reject(new Error(`${label} tag with ID '${id}' not found.`));
		}
		// Compare attributes directly: building a [src="..."] selector from the URL could throw
		const candidates = document.getElementsByTagName(tag);
		for (let i = 0; i < candidates.length; i++) {
			if (candidates[i].getAttribute(attr) === id) {
				el = candidates[i];
				break;
			}
		}
		if (!el) {
			el = document.createElement(tag);
			created = true;
			if (isScript) {
				el.async = true;
			} else {
				el.rel = "stylesheet";
			}
			el[attr] = id;
			(document.head || document.documentElement).appendChild(el);
		}
	}

	// SECURITY: Ensure the found element is the expected tag to prevent DOM Clobbering
	// and unintended execution of malicious payloads (e.g., via iframe data-src).
	if (!(el instanceof Type)) {
		return Promise.reject(new Error(`Element with ID '${id}' is not a valid ${tag} tag.`));
	}

	// CACHE CHECK: Did we (or another Gia bundle: _loadPromise is reserved from mangling) already start?
	if (el._loadPromise) {
		return el._loadPromise;
	}

	let promise = null;
	let failedSync = false;
	promise = new Promise((resolve, reject) => {
		const settle = (err) => {
			el.removeEventListener("load", onLoad);
			el.removeEventListener("error", onError);
			if (isScript) window.removeEventListener("load", onLoad);
			if (err) {
				// Do not cache failures, so a later call can retry; a tag we created is removed so
				// the retry fetches again instead of finding a dead tag that never fires load
				if (!promise) failedSync = true;
				else if (el._loadPromise === promise) delete el._loadPromise;
				if (created) el.remove();
				reject(err);
			} else {
				resolve(globalName ? window[globalName] : true);
			}
		};
		const onLoad = () => settle(null);
		const onError = () => settle(new Error(`Failed to load ${isScript ? "script" : "style"}: ${id}`));
		// addEventListener (not el.onload) so handlers set by the page or other code are kept
		el.addEventListener("load", onLoad);
		el.addEventListener("error", onError);

		// TRIGGER: Move data-src/data-href to src/href if not already done
		const dataAttr = `data-${attr}`;
		if (!el[attr] && el.hasAttribute(dataAttr)) {
			el[attr] = el.getAttribute(dataAttr);
			el.removeAttribute(dataAttr);
		} else if (!el[attr]) {
			settle(new Error(`${label} tag '${id}' has no ${attr} or ${dataAttr}.`));
		} else if (!created) {
			// The tag already had a src/href: it may have finished loading before we were called
			if (isScript) {
				_whenScriptAlreadyLoaded(el, onLoad);
			} else if (el.sheet) {
				onLoad();
			}
		}
	});
	if (!failedSync) {
		el._loadPromise = promise;
	}
	return promise;
}

/**
 * Loads a script that is already defined in the DOM with a data-src attribute, or a script URL.
 * Prevents double-loading and handles race conditions.
 * @param {string} scriptId - The exact ID of the script tag, or a URL
 * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
 * @return {Promise}
 */
export function loadScript(scriptId, globalName) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) {
		nanoUnsupported("loadScript");
		return Promise.resolve();
	}

	// SAFETY CHECK: Is the library already active globally?
	// Validate against DOM Clobbering false positives (Node, HTMLCollection, Window)
	if (globalName) {
		const existing = window[globalName];
		if (
			existing &&
			!(existing instanceof Node) &&
			!(existing instanceof HTMLCollection) &&
			!(existing instanceof Window)
		) {
			return Promise.resolve(existing);
		}
	}

	return _loadAsset(scriptId, true, globalName);
}

/**
 * Loads a stylesheet that is already defined in the DOM with a data-href attribute, or a CSS URL.
 * Prevents double-loading and handles race conditions.
 * @param {string} styleId - The exact ID of the link tag, or a URL
 * @return {Promise}
 */
export function loadStyle(styleId) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) {
		nanoUnsupported("loadStyle");
		return Promise.resolve();
	}
	return _loadAsset(styleId, false);
}
