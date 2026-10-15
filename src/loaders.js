/**
 * Dynamic script and stylesheet loaders with DOM clobbering protection and promise caching.
 */

const URL_REGEX = /^(?:https?:|\/\/|\/|\.\.?\/)|(?:\.js|\.css)$/;

/**
 * Loads a script that is already defined in the DOM with a data-src attribute.
 * Prevents double-loading and handles race conditions.
 * @param {string} scriptId - The exact ID of the script tag
 * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
 * @return {Promise}
 */
export function loadScript(scriptId, globalName) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return Promise.resolve();

	// SAFETY CHECK: Is the library already active globally?
	// Validate against DOM Clobbering false positives (Node, HTMLCollection, Window)
	if (
		globalName &&
		window[globalName] &&
		!(window[globalName] instanceof Node) &&
		!(window[globalName] instanceof HTMLCollection) &&
		!(window[globalName] instanceof Window)
	) {
		return Promise.resolve(window[globalName]);
	}

	// 2. DOM LOOKUP: Find the existing script tag or create from URL
	let script = document.getElementById(scriptId);
	if (!script) {
		const isUrl = typeof scriptId === "string" && URL_REGEX.test(scriptId);

		if (isUrl && typeof document !== "undefined") {
			script = document.querySelector(`script[src="${scriptId}"]`);
			if (!script) {
				script = document.createElement("script");
				script.src = scriptId;
				script.async = true;
				(document.head || document.documentElement).appendChild(script);
			}
		} else {
			return Promise.reject(new Error(`Script tag with ID '${scriptId}' not found.`));
		}
	}

	// SECURITY: Ensure the found element is actually a script tag to prevent DOM Clobbering
	// and unintended execution of malicious payloads (e.g., via iframe data-src).
	if (!(script instanceof HTMLScriptElement)) {
		return Promise.reject(new Error(`Element with ID '${scriptId}' is not a valid script tag.`));
	}

	// CACHE CHECK: Did we already start loading this?
	if (script._loadPromise) {
		return script._loadPromise;
	}

	// START LOADING
	script._loadPromise = new Promise((resolve, reject) => {
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
			delete script._loadPromise;
			reject(new Error(`Failed to load script: ${scriptId}`));
		};

		// TRIGGER: Move data-src to src if not already done
		if (!script.src && script.hasAttribute("data-src")) {
			script.src = script.getAttribute("data-src");
			script.removeAttribute("data-src");
		} else if (!script.src && !script.hasAttribute("data-src")) {
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
export function loadStyle(styleId) {
	if (typeof __GIA_NANO__ !== "undefined" && __GIA_NANO__) return Promise.resolve();

	// DOM LOOKUP: Find the existing link tag or create from URL
	let link = document.getElementById(styleId);
	if (!link) {
		const isUrl = typeof styleId === "string" && URL_REGEX.test(styleId);

		if (isUrl && typeof document !== "undefined") {
			link = document.querySelector(`link[href="${styleId}"]`);
			if (!link) {
				link = document.createElement("link");
				link.rel = "stylesheet";
				link.href = styleId;
				(document.head || document.documentElement).appendChild(link);
			}
		} else {
			return Promise.reject(new Error(`Link tag with ID '${styleId}' not found.`));
		}
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
			delete link._loadPromise;
			reject(new Error(`Failed to load style: ${styleId}`));
		};

		// TRIGGER: Move data-href to href if not already done
		if (!link.href && link.hasAttribute("data-href")) {
			link.href = link.getAttribute("data-href");
			link.removeAttribute("data-href");
		} else if (!link.href && !link.hasAttribute("data-href")) {
			cleanup();
			reject(new Error(`Link tag '${styleId}' has no href or data-href.`));
		} else if (link.href && !link.hasAttribute("data-href")) {
			// Already has href (might be pre-loaded)
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
