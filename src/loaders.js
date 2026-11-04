/**
 * Dynamic script and stylesheet loaders with DOM clobbering protection and promise caching.
 */

const URL_REGEX = /^(?:https?:|\/\/|\/|\.\.?\/)|(?:\.js|\.css)$/;

/**
 * Shared implementation for loadScript / loadStyle.
 * @param {string} id - Element ID, or a URL to load (an existing tag with that URL is reused)
 * @param {boolean} isScript
 * @param {string} [globalName] - Scripts only: global the script exposes (resolved value)
 */
function _loadAsset(id, isScript, globalName) {
	const tag = isScript ? "script" : "link";
	const attr = isScript ? "src" : "href";
	const label = isScript ? "Script" : "Link";

	// DOM LOOKUP: Find the existing tag by ID, or by URL, or create it from the URL
	let el = document.getElementById(id);
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
	if (!(el instanceof (isScript ? HTMLScriptElement : HTMLLinkElement))) {
		return Promise.reject(new Error(`Element with ID '${id}' is not a valid ${tag} tag.`));
	}

	// CACHE CHECK: Did we already start loading this?
	if (el._loadPromise) {
		return el._loadPromise;
	}

	el._loadPromise = new Promise((resolve, reject) => {
		const cleanup = () => {
			el.onload = null;
			el.onerror = null;
		};

		el.onload = () => {
			cleanup();
			resolve(globalName ? window[globalName] : true);
		};

		el.onerror = () => {
			cleanup();
			delete el._loadPromise;
			reject(new Error(`Failed to load ${isScript ? "script" : "style"}: ${id}`));
		};

		// TRIGGER: Move data-src/data-href to src/href if not already done
		const dataAttr = `data-${attr}`;
		if (!el[attr] && el.hasAttribute(dataAttr)) {
			el[attr] = el.getAttribute(dataAttr);
			el.removeAttribute(dataAttr);
		} else if (!el[attr]) {
			cleanup();
			reject(new Error(`${label} tag '${id}' has no ${attr} or ${dataAttr}.`));
		} else if (!isScript) {
			// Stylesheet already has an href: it may have finished loading before we were called
			for (let i = 0; i < document.styleSheets.length; i++) {
				if (document.styleSheets[i].href === el.href) {
					cleanup();
					resolve(true);
					break;
				}
			}
		}
	});

	return el._loadPromise;
}

/**
 * Loads a script that is already defined in the DOM with a data-src attribute, or a script URL.
 * Prevents double-loading and handles race conditions.
 * @param {string} scriptId - The exact ID of the script tag, or a URL
 * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
 * @return {Promise}
 */
export function loadScript(scriptId, globalName) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return Promise.resolve();

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
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return Promise.resolve();
	return _loadAsset(styleId, false);
}
