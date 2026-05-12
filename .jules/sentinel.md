## 2024-05-12 - Unauthorized Method Execution via data-action
**Vulnerability:** DOM-based unauthorized method execution via `data-action` attributes. `_autoBindActions` in `BaseComponent.js` allowed any property or method of a component (including internal methods starting with `_`, restricted methods like `setState`, and non-functions) to be bound to DOM events if an attacker could control `data-action` attributes.
**Learning:** Automatically binding event listeners from DOM attributes requires strict whitelisting or validation of the target methods to prevent users/attackers from executing arbitrary internal code by manipulating the DOM.
**Prevention:** Strictly validate dynamically bound methods to ensure they are public functions (e.g., `typeof === "function"`), do not start with `_`, and are not in a restricted list like `globalExcludedMethods` before attaching them to events.

## 2025-02-09 - DOM Clobbering Vulnerability in loadScript
**Vulnerability:** DOM-based XSS via DOM Clobbering in the `loadScript` method. The function queried an element by its ID and blindly moved its `data-src` attribute to `src`, assuming it was a script tag. If an attacker injects a non-script element (like an iframe) with the target ID, this could execute a malicious payload.
**Learning:** Never assume `document.getElementById` returns the expected tag type, especially when attributes like `src` or `data-src` can lead to code execution in elements like `iframe` or `object`.
**Prevention:** Validate the `tagName` of the retrieved element (e.g., `script.tagName === 'SCRIPT'`) before manipulating execution-sensitive attributes.
