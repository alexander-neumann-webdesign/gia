## 2024-05-12 - Unauthorized Method Execution via data-action
**Vulnerability:** DOM-based unauthorized method execution via `data-action` attributes. `_autoBindActions` allowed any property or method to be bound to DOM events if an attacker could control `data-action` attributes.
**Learning:** Automatically binding event listeners from DOM attributes requires strict whitelisting or validation of the target methods.
**Prevention:** Strictly validate dynamically bound methods to ensure they are public functions, do not start with `_`, and are not in a restricted list like `globalExcludedMethods`.

## 2025-02-14 - DOM Clobbering Bypass via tagName property (Consolidated)
**Vulnerability:** Validating elements using `tagName` or `nodeName` (e.g., `element.tagName === 'SCRIPT'`) is vulnerable to DOM Clobbering. An attacker can inject nested elements with matching `name` attributes (like `<input name="tagName">` inside a `<form>`), which overwrites the `tagName` property.
**Learning:** Never rely on overrideable properties like `tagName` for security validation or logic branching, especially when dealing with elements retrieved from the DOM.
**Prevention:** Always use strict prototype chain checks (e.g., `element instanceof HTMLScriptElement` or `element instanceof HTMLFormElement`) instead of checking string properties to ensure the element is strictly of the expected type.

## 2025-02-09 - Reverse Tabnabbing via target="_blank"
**Vulnerability:** External links opening in a new tab (`target="_blank"`) without `rel="noopener noreferrer"` can expose the `window.opener` object, leading to Reverse Tabnabbing attacks.
**Learning:** Omitting `noopener` can leave older browsers vulnerable and indicates a lack of explicit security intent.
**Prevention:** Always append `rel="noopener noreferrer"` to any anchor tag that uses `target="_blank"`.

## 2024-05-14 - Leaflet bindPopup XSS Vulnerability
**Vulnerability:** XSS vulnerability found in `OpenStreetMap.js` because `marker.bindPopup(loc.title)` treats string input as raw HTML.
**Learning:** Passing a plain string directly to `bindPopup` exposes the application to XSS if the string is untrusted.
**Prevention:** Always create a DOM element, set its `textContent` (or `innerText`) to safely escape the input, and pass the DOM element to `bindPopup(element)`.

## 2026-05-27 - DOM-based XSS via innerHTML and insertAdjacentHTML (Consolidated)
**Vulnerability:** XSS vulnerabilities occur when untrusted data (like `data-*` attributes) or cached DOM content is dynamically injected back into the DOM using `innerHTML` or `insertAdjacentHTML` with string interpolation.
**Learning:** Using string interpolation to build HTML elements creates a direct pathway for DOM-based XSS. Caching `innerHTML` and re-injecting it alongside new elements is also dangerous if the initial state can be user-controlled.
**Prevention:** Avoid `innerHTML` and `insertAdjacentHTML` with dynamic variables entirely. For text, use `.textContent`. For new elements, use safe DOM APIs like `document.createElement()`, `document.createElementNS()` (for SVGs), or `new DOMParser().parseFromString()`. Append them using `appendChild` or `.append()`. If you must add static HTML, use `insertAdjacentHTML` strictly with hardcoded strings.

## 2026-05-19 - File Uploads DataTransfer & XSS Prevention
**Learning/Vulnerability:** Using `innerHTML` for rendering dynamic file data allows DOM-based XSS if user-controlled file names contain malicious payloads. Further, native `<input type="file">`.files represents a read-only `FileList`. Overwriting it requires a new `DataTransfer` object. Finally, removing files using their `name` strings introduces a bug if multiple files have duplicate names.
**Action/Prevention:** Neutralize XSS vectors by constructing the file item DOM using `document.createElement()` and assigning text purely via `.textContent`. Manage `FileList` state by iteratively constructing a `DataTransfer` object, adding valid `File` objects, and comparing by object reference (`file !== fileToRemove`) instead of name to reliably handle duplicates.

## 2024-05-20 - DOM DoS via Prototype Pollution in Component Refs
**Vulnerability:** The component `_ref` initialization used a standard dictionary object `const refsByName = {}` to group matched DOM elements. An attacker could add an element with `data-ref="__proto__"`. Since `list` would evaluate to `Object.prototype`, trying to call `list.push(element)` triggers a DOM DoS crashing the page because `.push` doesn't exist on `Object.prototype`.
**Learning:** Initializing dictionaries for grouping keys from DOM attributes as plain objects `{}` is inherently unsafe in JS, as reserved keys like `__proto__` can collide with built-in properties causing fatal errors on basic operations.
**Prevention:** Always use `Object.create(null)` to create safe dictionary objects when caching or storing state parsed from potentially attacker-controlled DOM attributes.

## 2026-05-25 - DOM Clobbering False Positive in Global Checks (Consolidated)
**Vulnerability:** Global namespace checks (like checking if `window['Flip']` exists in `loadScript`) can be clobbered by the browser automatically mapping elements with `id="Flip"` or `<iframe name="Flip">` to the `window` object. This causes false positives, preventing the actual library from loading.
**Learning:** Checking `window[name]` is insufficient because DOM elements (`Node`), collections of matching elements (`HTMLCollection`), and iframes (`Window`) can all overwrite these properties.
**Prevention:** When verifying the existence of a global library variable, explicitly validate that the resolved variable is not an auto-generated DOM reference: `!(val instanceof Node) && !(val instanceof HTMLCollection) && !(val instanceof Window)`.
## 2024-05-15 - DOM-based XSS in Component Options
**Vulnerability:** The Toaster component used `innerHTML` string concatenation to build toast notifications from configuration options (`title` and `description`), allowing DOM-based XSS if options originated from user input.
**Learning:** Component options in Gia frameworks (or generally) may originate from `data-options` attributes or other inputs, which could be influenced by users. Dynamically rendering them via `innerHTML` without sanitization introduces XSS risks.
**Prevention:** Always use safe DOM manipulation APIs like `document.createElement()` and `textContent` for dynamic text properties, or sanitize input when HTML rendering is strictly required. For static structural HTML, safe APIs like `insertAdjacentHTML` with hardcoded strings are acceptable.
## 2024-05-25 - Fix DOM XSS in CustomCursor
**Vulnerability:** Found `innerHTML` being used with unescaped data (`targetIcon` attribute value) to construct an SVG, leading to DOM-based XSS.
**Learning:** Using `innerHTML` with string interpolation of attributes can execute malicious payload, even for SVGs.
**Prevention:** Use DOM-safe APIs like `document.createElementNS` for SVGs or `textContent` for text instead of `innerHTML`.
