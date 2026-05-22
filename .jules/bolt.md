## 2024-05-16 - Object Iteration in High-Frequency Methods
**Learning:** In highly-frequent component updates (`_flushStateChanges` and the `ref` setter), using `for...in` combined with `Object.prototype.hasOwnProperty.call()` creates measurable overhead. However, `for...in` is still useful for fast-failing checks (like checking if an object is empty without allocating an array).
**Action:** For O(1) empty object checks, use a fast-failing `for...in` loop. For O(N) full object iteration, use `Object.keys()` or `Object.entries()` combined with a standard `for` loop to avoid iterating through the prototype chain and eliminate function call overhead.

## 2026-05-18 - Optimize DOM loadComponents in MutationObserver
**Learning:** Calling `loadComponents` on every newly added node via `MutationObserver` in `autoMount.js` means overhead scales linearly with the number of DOM insertions.
**Action:** Always optimize high-frequency lifecycle methods (like those triggered by MutationObservers) to avoid allocating intermediate arrays and closure functions. Inline helper logic directly into the loop.## 2024-05-19 - Pre-allocated array in high-frequency global observers\n**Learning/Vulnerability:** Creating arrays like `[entry]` inside high-frequency loops (like the inner loop of a `ResizeObserver` or `IntersectionObserver` global handler) causes significant garbage collection overhead, leading to frame drops. However, simply using a single shared array across all iterations introduces a bug where asynchronous listeners might read mutated shared state.\n**Action/Prevention:** Since these are synchronous callbacks passing array arguments iteratively, it is safe and highly performant to allocate a single wrapping array OUTSIDE the inner loop (e.g., `const entryArr = [null];`) and then assign the single target element INSIDE the loop (e.g., `entryArr[0] = entry;`) before invoking callbacks.
**Action:** Always optimize high-frequency lifecycle methods (like those triggered by MutationObservers) to avoid allocating intermediate arrays and closure functions. Inline helper logic directly into the loop.## 2024-05-19 - Observer Callback Array Reuse Anti-Pattern
**Learning:** Hoisting an array outside a callback loop (like `const entryArr = [null];`) and mutating it inside the loop to pass to callbacks (to save garbage collection overhead) is an anti-pattern. If any callback defers execution, debounces, or stores the array reference, it will read the mutated state of the final iteration rather than its own snapshot.
**Action:** Do not attempt to share array references across iterations in observer loops or event emitters just to avoid GC pressure. The safety cost outweighs the micro-optimization. The standard `const entryArr = [entry];` allocation inside the loop is required for correctness.

## 2024-05-19 - Inline getComponentFromElement in Hot Paths
**Learning:** `loadComponents` runs continuously on `MutationObserver` triggers via `autoMount.js`. Calling `getComponentFromElement(element)` for every single node introduces redundant function call and string-type check overhead inside this extremely hot path.
**Action:** In loops where the target is definitively known to be a DOM element (like iterating `addedNodes`), bypass `getComponentFromElement` entirely and inline the access directly via `element.__gia_component__`.
## 2026-05-19 - Observer Callback Array Reuse Anti-Pattern\n**Learning:** Hoisting an array outside a callback loop (like `const entryArr = [null];`) and mutating it inside the loop to pass to callbacks (to save garbage collection overhead) is an anti-pattern. If any callback defers execution, debounces, or stores the array reference, it will read the mutated state of the final iteration rather than its own snapshot.\n**Action:** Do not attempt to share array references across iterations in observer loops or event emitters just to avoid GC pressure. The safety cost outweighs the micro-optimization. The standard `const entryArr = [entry];` allocation inside the loop is required for correctness.

## 2024-05-19 - Object Iteration Array Allocations in High-Frequency Paths
**Learning:** Checking if an object is empty via `Object.keys(obj).length === 0` allocates an intermediate array and iterates through all keys in the JS engine. When used in high-frequency methods like `set ref` or `_flushStateChanges` (which run constantly during component initialization or game loops), this creates measurable garbage collection overhead leading to micro-stutters.
**Action:** Replace `Object.keys(obj).length === 0` checks with a fast-failing `for...in` loop. This achieves an O(1) empty check with zero memory allocation. Use this pattern strictly for empty object checks, not for full iteration.

## 2024-05-19 - Layout Thrashing in requestAnimationFrame
**Learning:** Checking layout properties (like `getBoundingClientRect()`, `offsetHeight`, `window.scrollY`) inside a `requestAnimationFrame` callback loop triggers a forced synchronous layout recalculation if any other components mutated the DOM earlier in the same frame. Deferring layout reads using boolean flags (like `_needsBoundsUpdate`) until the next `rAF` tick is an anti-pattern.
**Action:** Extract all layout reads out of `requestAnimationFrame`. Execute them synchronously inside observer callbacks (`ResizeObserver`, `IntersectionObserver`) or event handlers (`scroll`, `resize`), cache the result, and let the `rAF` loop strictly perform mathematical calculations and DOM writes based on the cached values.
## 2026-05-21 - [Infinite Loops from Weak Comparison]
**Learning:** In a codebase using custom state management coupled with native DOM elements, directly assigning a number to an `input.value` automatically serializes it to a string. Validating updates with `input.value !== newValue` triggers an infinite loop when `newValue` is a number because `"10" !== 10` is always true.
**Action:** When synchronizing state back to `<input type="number">` or `range`, always parse both values into floats before comparing, and ensure you explicitly handle empty strings which resolve to `NaN` to prevent `NaN !== NaN` infinite loops.
## Extracted large looping methods

**Pattern:** Splitting large iterative methods in array-processing loops (`_filterItems` in lists).
**Learning:** For extremely large and deeply nested functions that do array traversal, extracting the conditional matching logic into isolated, state-free helper methods (`_isItemVisible`, `_itemMatchesFilter`) drastically improves code clarity and maintainability without incurring noticeable performance penalties, even in `requestAnimationFrame` contexts.
**Application:** Keep boolean branching isolated from the loop iteration mechanism.
## 2024-05-22 - Optimize DOM loadComponents in MutationObserver (Revisited)
**Learning:** Calling `loadComponents` on every newly added node via `MutationObserver` in `autoMount.js` means overhead scales linearly with the number of DOM insertions. `loadComponents` calls `querySelectorAll` which is slow.
**Action:** When tracking added nodes in the `MutationObserver`, filter them by checking if the node is or contains a component before adding them to the tracking set (`node.hasAttribute(attrName) || node.querySelector(...)`). This completely bypasses processing overhead for large blocks of plain HTML insertions.

## 2024-05-19 - Defer Event Bindings
**Learning:** Attaching global `pointermove`, `pointerup`, and `pointercancel` listeners on the `window` constantly can cause performance degradation because events fire whenever the mouse moves, even if the user isn't actively interacting.
**Action:** When implementing drag interactions (like marquees or sliders), attach `pointermove`, `pointerup`, and `pointercancel` listeners to the `window` dynamically inside the `pointerdown` handler, and remove them on `pointerup`.

## 2024-05-19 - Passive Pointermove Event Binding
**Learning:** If an interaction does not need to cancel scrolling (e.g., using `touch-action: pan-y`), passing `{ passive: false }` to the event listener can still block the browser's scrolling thread and cause jank.
**Action:** When attaching `pointermove` listeners for interactions that do not require calling `preventDefault()`, use `{ passive: true }` to avoid blocking the main scrolling thread.

## 2024-05-19 - Bypass Property Getters in Hot Paths
**Learning:** Accessing `this.state` via a getter that returns `this._state` adds a slight performance overhead. Over thousands of frames, this can become a minor bottleneck.
**Action:** In performance-critical animation loops (e.g., `requestAnimationFrame`), bypass getter methods for state objects and directly access their underlying properties (like `this._state`) to eliminate unnecessary function call overhead on every frame.
## 2026-05-22 - Prevent layout thrashing in ImageHolder
**Learning:** To prevent forced synchronous layouts inside requestAnimationFrame loops, never defer layout reads (e.g., getBoundingClientRect()) using dirty flags like state properties. Instead, perform these reads synchronously inside observer callbacks (like ResizeObserver or IntersectionObserver) or event handlers, and cache the values to be used purely for mathematical updates in the animation frame.
**Action:** Reordered layout reads to happen before DOM writes in initialization and resize handlers, and moved layout caching from the async stateChange loop to the synchronous IntersectionObserver callback.
