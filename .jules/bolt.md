## 2024-05-16 - Object Iteration in High-Frequency Methods
**Learning:** In highly-frequent component updates (`_flushStateChanges` and the `ref` setter), using `for...in` combined with `Object.prototype.hasOwnProperty.call()` creates measurable overhead. However, `for...in` is still useful for fast-failing checks (like checking if an object is empty without allocating an array).
**Action:** For O(1) empty object checks, use a fast-failing `for...in` loop. For O(N) full object iteration, use `Object.keys()` or `Object.entries()` combined with a standard `for` loop to avoid iterating through the prototype chain and eliminate function call overhead.

## 2026-05-18 - Optimize DOM loadComponents in MutationObserver
**Learning:** Calling `loadComponents` on every newly added node via `MutationObserver` in `autoMount.js` means overhead scales linearly with the number of DOM insertions.
**Action:** Always optimize high-frequency lifecycle methods (like those triggered by MutationObservers) to avoid allocating intermediate arrays and closure functions. Inline helper logic directly into the loop.