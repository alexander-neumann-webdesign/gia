## 2024-05-12 - Unauthorized Method Execution via data-action
**Vulnerability:** DOM-based unauthorized method execution via `data-action` attributes. `_autoBindActions` allowed any property or method to be bound to DOM events if an attacker could control `data-action` attributes.
**Learning:** Automatically binding event listeners from DOM attributes requires strict whitelisting or validation of the target methods.
**Prevention:** Strictly validate dynamically bound methods to ensure they are public functions, do not start with `_`, and are not in a restricted list like `globalExcludedMethods`.

## 2025-02-09 - DOM Clobbering in Element Validation
**Vulnerability:** DOM-based XSS via DOM Clobbering. Validating elements using `tagName` (e.g., `element.tagName === 'SCRIPT'`) can be bypassed because nested elements with matching `name` attributes (like `<input name="tagName">` inside a `<form>`) can overwrite the `tagName` property.
**Learning:** Never rely on `tagName` or `nodeName` for security validation, especially when dealing with attributes like `src` that can lead to code execution.
**Prevention:** Use `instanceof` checks against specific element interfaces (e.g., `element instanceof HTMLScriptElement`) when validating elements retrieved from the DOM.

## 2025-02-09 - Reverse Tabnabbing via target="_blank"
**Vulnerability:** External links opening in a new tab (`target="_blank"`) without `rel="noopener noreferrer"` can expose the `window.opener` object, leading to Reverse Tabnabbing attacks.
**Learning:** Omitting `noopener` can leave older browsers vulnerable and indicates a lack of explicit security intent.
**Prevention:** Always append `rel="noopener noreferrer"` to any anchor tag that uses `target="_blank"`.

## 2024-05-14 - Leaflet bindPopup XSS Vulnerability
**Vulnerability:** XSS vulnerability found in `OpenStreetMap.js` because `marker.bindPopup(loc.title)` treats string input as raw HTML.
**Learning:** Passing a plain string directly to `bindPopup` exposes the application to XSS if the string is untrusted.
**Prevention:** Always create a DOM element, set its `textContent` (or `innerText`) to safely escape the input, and pass the DOM element to `bindPopup(element)`.

## 2025-02-09 - DOM-based XSS via innerHTML
**Vulnerability:** XSS vulnerability found when dynamic attributes (like `data-cursor-img` or `data-cursor-icon`) were injected directly into `innerHTML` using string interpolation.
**Learning:** Using untrusted data directly within `innerHTML` interpolation strings creates a direct pathway for DOM-based XSS, even for SVGs.
**Prevention:** Avoid `innerHTML` with dynamic variables. Use safe DOM APIs like `document.createElement` (or `document.createElementNS` for SVGs), set properties and attributes directly, and use `appendChild` or `replaceChildren`.