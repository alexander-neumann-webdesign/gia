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

## 2025-02-09 - DOM-based XSS via innerHTML and data attributes
**Vulnerability:** XSS vulnerability found in `CustomCursor.js` because `data-cursor-img` and `data-cursor-video` attributes were dynamically read from the DOM and injected directly into `innerHTML` using string interpolation. This allowed attackers to inject malicious HTML/JavaScript.
**Learning:** Using untrusted data (even data from your own DOM if it's user-controlled) directly within `innerHTML` interpolation strings creates a direct pathway for DOM-based XSS.
**Prevention:** Avoid `innerHTML` with dynamic variables whenever possible. Instead, use safe DOM APIs like `document.createElement`, setting properties like `src`, `textContent`, and styles directly, and then append the elements using `appendChild`.

## 2025-02-09 - DOM-based XSS via innerHTML and data attributes (Icon)
**Vulnerability:** XSS vulnerability found in `CustomCursor.js` because `data-cursor-icon` attribute was dynamically read from the DOM and injected directly into `innerHTML` using string interpolation to create SVG. This allowed attackers to inject malicious HTML/JavaScript.
**Learning:** Using untrusted data directly within `innerHTML` interpolation strings creates a direct pathway for DOM-based XSS, even for seemingly safe elements like SVGs.
**Prevention:** Avoid `innerHTML` with dynamic variables whenever possible. Use safe DOM APIs like `document.createElementNS` for SVG elements, setting properties and attributes directly, and then append the elements using `appendChild`.

## 2025-02-14 - DOM Clobbering Bypass via tagName property
**Vulnerability:** A previous fix for DOM Clobbering in `loadScript` and `loadStyle` relied on `element.tagName === 'SCRIPT'`. This check itself was vulnerable to DOM Clobbering because an attacker could inject an element like `<form id="scriptId"><input name="tagName" value="SCRIPT"></form>`. In older browsers or certain contexts, `form.tagName` would return the input element rather than `'FORM'`, effectively bypassing the check.
**Learning:** Properties like `tagName` on DOM elements can be clobbered by nested elements with matching `name` attributes, especially within `<form>` tags.
**Prevention:** Use `instanceof` checks against specific element interfaces (e.g., `element instanceof HTMLScriptElement`) rather than relying on the `tagName` property when validating elements retrieved from the DOM.

## 2025-02-14 - DOM Clobbering in multiple components using tagName property
**Vulnerability:** Several examples components (`Accordion.js`, `FilterableList.js`, `Form.js`, `Modal.js`, `OffCanvasMenu.js`) relied on checking `element.tagName === '...'`. As seen previously, this is vulnerable to DOM Clobbering (e.g. an attacker injecting an element like `<input name="tagName">` inside the form). This effectively bypasses the type check.
**Learning:** Checking `element.tagName` can be easily clobbered. Any logic relying on it can be bypassed if the user has some control over the DOM.
**Prevention:** Replaced all occurrences of `element.tagName === '...'` with the more secure `element instanceof HTMLElementType` pattern (e.g., `element instanceof HTMLFormElement`). This ensures the element is strictly of the expected type, rather than relying on an overrideable property.
## 2026-05-19 - File Uploads DataTransfer & XSS Prevention
**Learning/Vulnerability:** Using `innerHTML` for rendering dynamic file data allows DOM-based XSS if user-controlled file names contain malicious payloads. Further, native `<input type="file">`.files represents a read-only `FileList`. Overwriting it requires a new `DataTransfer` object. Finally, removing files using their `name` strings introduces a bug if multiple files have duplicate names.
**Action/Prevention:** Neutralize XSS vectors by constructing the file item DOM using `document.createElement()` and assigning text purely via `.textContent`. Manage `FileList` state by iteratively constructing a `DataTransfer` object, adding valid `File` objects, and comparing by object reference (`file !== fileToRemove`) instead of name to reliably handle duplicates.
