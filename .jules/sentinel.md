## 2024-05-12 - Unauthorized Method Execution via data-action
**Vulnerability:** DOM-based unauthorized method execution via `data-action` attributes. `_autoBindActions` in `BaseComponent.js` allowed any property or method of a component (including internal methods starting with `_`, restricted methods like `setState`, and non-functions) to be bound to DOM events if an attacker could control `data-action` attributes.
**Learning:** Automatically binding event listeners from DOM attributes requires strict whitelisting or validation of the target methods to prevent users/attackers from executing arbitrary internal code by manipulating the DOM.
**Prevention:** Strictly validate dynamically bound methods to ensure they are public functions (e.g., `typeof === "function"`), do not start with `_`, and are not in a restricted list like `globalExcludedMethods` before attaching them to events.

## 2026-05-13 - DOM Clobbering in script loading
**Vulnerability:** The `loadScript` method retrieved elements by ID to execute scripts using `document.getElementById`, but didn't verify the returned element was actually a `<script>` tag.
**Learning:** This exposes a DOM clobbering vulnerability where a malicious user could inject elements like `<iframe>` with an ID matching the script and a malicious `data-src` payload, which the component would then inadvertently execute.
**Prevention:** Always explicitly check the `tagName` (e.g., `script.tagName === 'SCRIPT'`) when looking up elements by ID for execution, especially if those elements can contain execution sources or payloads.
