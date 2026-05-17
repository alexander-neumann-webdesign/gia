## 2024-05-12 - Unauthorized Method Execution via data-action
**Vulnerability:** DOM-based unauthorized method execution via `data-action` attributes. `_autoBindActions` in `BaseComponent.js` allowed any property or method of a component (including internal methods starting with `_`, restricted methods like `setState`, and non-functions) to be bound to DOM events if an attacker could control `data-action` attributes.
**Learning:** Automatically binding event listeners from DOM attributes requires strict whitelisting or validation of the target methods to prevent users/attackers from executing arbitrary internal code by manipulating the DOM.
**Prevention:** Strictly validate dynamically bound methods to ensure they are public functions (e.g., `typeof === "function"`), do not start with `_`, and are not in a restricted list like `globalExcludedMethods` before attaching them to events.

## 2025-02-09 - DOM Clobbering Vulnerability in loadScript
**Vulnerability:** DOM-based XSS via DOM Clobbering in the `loadScript` method. The function queried an element by its ID and blindly moved its `data-src` attribute to `src`, assuming it was a script tag. If an attacker injects a non-script element (like an iframe) with the target ID, this could execute a malicious payload.
**Learning:** Never assume `document.getElementById` returns the expected tag type, especially when attributes like `src` or `data-src` can lead to code execution in elements like `iframe` or `object`.
**Prevention:** Validate the `tagName` of the retrieved element (e.g., `script.tagName === 'SCRIPT'`) before manipulating execution-sensitive attributes.

## 2025-02-09 - Reverse Tabnabbing via target="_blank"
**Vulnerability:** External links opening in a new tab (`target="_blank"`) without `rel="noopener noreferrer"` can expose the `window.opener` object to the newly opened page. A malicious page can use `window.opener.location` to redirect the original application page to a phishing site.
**Learning:** Even though modern browsers default to `noopener` for `target="_blank"`, omitting the attribute can leave older browsers vulnerable and indicates a lack of explicit security intent.
**Prevention:** Always append `rel="noopener noreferrer"` to any anchor tag that uses `target="_blank"` to fully mitigate Reverse Tabnabbing attacks across all browser environments.

## 2024-05-14 - Leaflet bindPopup XSS Vulnerability
**Vulnerability:** XSS vulnerability found in `OpenStreetMap.js` because `marker.bindPopup(loc.title)` treats string input as raw HTML.
**Learning:** Leaflet's `bindPopup(content)` method behaves differently depending on the input type. Passing a plain string directly exposes the application to Cross-Site Scripting (XSS) if the string is untrusted, as Leaflet interprets it as HTML.
**Prevention:** Always create a DOM element, set its `textContent` (or `innerText`) to safely escape the input, and pass the DOM element to `bindPopup(element)` instead of a raw string.

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
