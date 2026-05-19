## 2024-05-16 - Faster Object Iteration in BaseComponent
**Learning:** In highly-frequent component updates (`_flushStateChanges` and the `ref` setter), using `for...in` combined with `Object.prototype.hasOwnProperty.call()` creates measurable overhead compared to using `Object.keys()` with a standard `for` loop. The latter avoids iterating through the prototype chain and eliminates function call overhead on every property check.
**Action:** Always prefer `Object.keys()` or `Object.entries()` with a standard `for` loop over `for...in` when iterating over object properties in high-frequency/core library methods.

## 2026-05-18 - Optimize DOM loadComponents in MutationObserver
**Learning:** The architectural decision to call `loadComponents` on every newly added node via `MutationObserver` in `autoMount.js` means that overhead inside `loadComponents` (like calling `Object.keys(components)` or creating inner closure functions like `processElement`) scales linearly with the number of DOM insertions. This creates a hidden performance bottleneck involving garbage collection and memory allocations in highly dynamic interfaces.
**Action:** Always optimize high-frequency lifecycle methods (like those triggered by MutationObservers) to avoid allocating intermediate arrays (use early-exit `for...in` instead of `Object.keys(obj).length === 0`) and closure functions.
## 2026-05-19 - Optimize DOM loadScript/loadStyle memory allocations
**Learning:** In high-frequency component paths or DOM manipulation cycles, accessing `element.dataset` triggers the creation of a `DOMStringMap` object by the browser. This introduces measurable garbage collection overhead compared to simply reading the attribute directly.
**Action:** When speed and low memory allocation are paramount (like in core library functions `_autoBindActions`, `loadScript`, or `loadStyle`), replace `element.dataset.myKey` with `element.getAttribute('data-my-key')`.
