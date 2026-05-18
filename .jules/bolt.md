## 2024-05-16 - Faster Object Iteration in BaseComponent
**Learning:** In highly-frequent component updates (`_flushStateChanges` and the `ref` setter), using `for...in` combined with `Object.prototype.hasOwnProperty.call()` creates measurable overhead compared to using `Object.keys()` with a standard `for` loop. The latter avoids iterating through the prototype chain and eliminates function call overhead on every property check.
**Action:** Always prefer `Object.keys()` or `Object.entries()` with a standard `for` loop over `for...in` when iterating over object properties in high-frequency/core library methods.

## 2024-05-18 - Minimize Closure Allocations in Core DOM Loops
**Learning:** In highly frequent paths like `loadComponents`, creating inline closure functions (e.g. `const processElement = (element) => {...}`) inside the outer function scope incurs unnecessary function allocation and garbage collection overhead. Furthermore, doing array object allocations just to check emptiness (e.g., `Object.keys(components).length === 0`) adds up quickly.
**Action:** When writing high-frequency code like DOM element processing or MutationObserver handlers, inline the logic directly into standard `for` loops to avoid per-node function closure allocations. Replace `Object.keys(x).length === 0` with a fast-failing `for...in` loop to avoid intermediate array allocation.
