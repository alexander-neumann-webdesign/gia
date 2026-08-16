## 2024-05-19 - Avoid Object.keys() Array Allocations (Consolidated)
**Learning:** Checking if an object is empty via `Object.keys(obj).length === 0`, or iterating over an object with `Object.keys()`, allocates an intermediate array in the JS engine. In high-frequency paths (like `setState`, `set ref`, or `_flushStateChanges`), this creates measurable garbage collection churn.
**Action:** Replace `Object.keys()` checks with a fast-failing `for...in` loop. This achieves an O(1) empty check with zero memory allocation. For full O(N) iteration in hot paths where prototype traversal is a concern, `for...in` coupled with `Object.prototype.hasOwnProperty.call()` is still more memory-efficient than allocating an array, though standard `for` loops on arrays are always preferred if possible.

## 2024-05-19 - Pre-allocated array in high-frequency global observers
**Learning/Vulnerability:** Creating arrays like `[entry]` inside high-frequency loops (like the inner loop of a `ResizeObserver` or `IntersectionObserver` global handler) causes significant garbage collection overhead, leading to frame drops. However, simply using a single shared array across all iterations introduces a bug where asynchronous listeners might read mutated shared state.
**Action/Prevention:** Since these are synchronous callbacks passing array arguments iteratively, it is safe and highly performant to allocate a single wrapping array OUTSIDE the inner loop (e.g., `const entryArr = [null];`) and then assign the single target element INSIDE the loop (e.g., `entryArr[0] = entry;`) before invoking callbacks. Just ensure that the callbacks read the data synchronously and do not defer access.

## 2024-05-19 - Inline getComponentFromElement in Hot Paths
**Learning:** `loadComponents` runs continuously on `MutationObserver` triggers via `autoMount.js`. Calling `getComponentFromElement(element)` for every single node introduces redundant function call and string-type check overhead inside this extremely hot path.
**Action:** In loops where the target is definitively known to be a DOM element (like iterating `addedNodes`), bypass `getComponentFromElement` entirely and inline the access directly via `element.__gia_component__`.

## 2024-05-22 - Optimize DOM loadComponents in MutationObserver
**Learning:** Calling `loadComponents` on every newly added node via `MutationObserver` in `autoMount.js` means overhead scales linearly with the number of DOM insertions. `loadComponents` calls `querySelectorAll` which is slow.
**Action:** When tracking added nodes in the `MutationObserver`, filter them by checking if the node is or contains a component before adding them to the tracking set (`node.hasAttribute(attrName) || node.querySelector(...)`). This completely bypasses processing overhead for large blocks of plain HTML insertions.

## 2026-05-21 - Infinite Loops from Weak Comparison
**Learning:** In a codebase using custom state management coupled with native DOM elements, directly assigning a number to an `input.value` automatically serializes it to a string. Validating updates with `input.value !== newValue` triggers an infinite loop when `newValue` is a number because `"10" !== 10` is always true.
**Action:** When synchronizing state back to `<input type="number">` or `range`, always parse both values into floats before comparing, and ensure you explicitly handle empty strings which resolve to `NaN` to prevent `NaN !== NaN` infinite loops.

## 2026-05-22 - Refactored complex monolithic stateChange method
**Pattern:** Splitting large iterative methods in array-processing loops (`_filterItems` in lists) or `stateChange` functions.
**Learning:** Encapsulating complex logic (especially boolean matching, View Transitions, and procedural animations) into smaller, well-named helper methods drastically improves readability without sacrificing performance.
**Action:** Explicitly break down sequential tasks (e.g. `_updateDOM`, `_measureTargetHeight`, `_applyViewTransition`, `_isItemVisible`) into separate private methods.

## 2024-05-19 - Defer Event Bindings
**Learning:** Attaching global `pointermove`, `pointerup`, and `pointercancel` listeners on the `window` constantly can cause performance degradation because events fire whenever the mouse moves, even if the user isn't actively interacting.
**Action:** When implementing drag interactions, attach these listeners to the `window` dynamically inside the `pointerdown` handler, and remove them on `pointerup`.

## 2024-05-19 - Passive Pointermove Event Binding
**Learning:** If an interaction does not need to cancel scrolling (e.g., using `touch-action: pan-y`), passing `{ passive: false }` to the event listener can still block the browser's scrolling thread and cause jank.
**Action:** Use `{ passive: true }` to avoid blocking the main scrolling thread when `preventDefault()` is not required.

## 2024-05-22 - Defer Layout-Trashing Events out of rAF
**Learning:** Dispatching a global `resize` event synchronously from within a `requestAnimationFrame` loop forces all resize listeners in the application to fire immediately, potentially causing synchronous layout thrashing.
**Action:** Defer global event dispatches to the next task queue using `setTimeout(..., 0)` so the browser can paint the current frame first.

## 2026-05-22 - Optimize View Transitions API Snapshotting
**Learning:** Assigning a `view-transition-name` to all hidden elements forces the browser to unnecessarily snapshot and generate dummy pseudo-element trees for items that are completely invisible.
**Action:** Conditionally wrap the assignment of `view-transition-name` for hidden elements (e.g., `if (!element.hidden)`) to only process active transitions.

## 2024-05-22 - Refactor Duplicate Embla Slide Logic
**Learning:** Identical nested looping logic inside the `Slider` component increases maintenance surface area.
**Action:** Extract complex loops into a separate helper method (like `_applyEmblaEffect(embla, eventName, callback)`).

## 2024-05-23 - Nested Iterators (forEach / for...of) in Hot Paths
**Learning:** High-frequency methods (like Embla `scroll` handlers, WAAPI arrays, or `requestAnimationFrame` loops) using array iteration methods like `.forEach()` or `for...of` allocate inline closure functions or Iterator objects on every frame, creating GC overhead.
**Action:** Always optimize high-frequency lifecycle and event loops by replacing `.forEach()` and `for...of` with standard `for` loops (e.g., `for (let i = 0; i < arr.length; i++)`) to completely eliminate allocations.

## 2024-06-02 - Hoist closure functions to eliminate GC churn on unmount
**Learning:** Methods like `_destroy`, `unobserveResize`, `unobserveIntersection`, and `processHash` were allocating new inline closure functions when calling `forEach` on Sets or Maps. This causes unnecessary GC churn. (Note: standard `for` loops cannot iterate Sets/Maps, so `.forEach` is required here).
**Action:** Hoist callback functions to the outer scope when possible and use the native `thisArg` parameter, or pass native prototype methods directly (e.g., `Set.prototype.delete`).

## 2024-06-04 - Eliminate array allocations and context loss in debounce
**Learning:** `debounce` functions using rest parameters (`...args`) and spread syntax (`...lastArgs`) allocate intermediate arrays and lose `this` context.
**Action:** Prefer standard `arguments` and `.apply(lastThis, lastArgs)` to eliminate intermediate array allocations and properly pass the `this` context.

## 2024-06-25 - Prevent GC churn in MutationObserver callbacks
**Learning:** Allocating collections like `new Set()` inside high-frequency event handlers such as `MutationObserver` introduces GC overhead.
**Action:** Extract the collection to the module scope and reuse it by calling `.clear()` on each invocation of the handler.

## 2024-07-04 - Cache getComputedStyle to prevent layout thrashing
**Learning:** Calling `window.getComputedStyle(el)` during high-frequency events causes synchronous style recalculations.
**Action:** Cache the result of `getComputedStyle` on the element's `dataset` or a bounds object.

## 2024-05-24 - Double-Buffering Arrays to Prevent GC Churn in Hot Loops
**Learning:** Recreating `reads = []` and `writes = []` on every frame in the `scheduler` causes constant GC churn.
**Action:** Use double-buffering by keeping a pre-allocated empty array (`tempReads`, `tempWrites`). Swap them during the flush phase, execute, then clear and reassign.

## 2026-07-15 - Centralized Global Observers (Intersection, Resize, Scroll)
**Learning:** Instantiating multiple native `IntersectionObserver` or `ResizeObserver` instances per component leads to massive memory overhead and severe performance degradation when dealing with hundreds of elements. Similarly, binding multiple raw `scroll` or `resize` event listeners blocks the main thread.
**Action:** Use Gia's centralized global observers (`this.observeIntersection`, `this.observeResize`, `this.observeScroll`, `this.observeWindowResize`). These group multiple elements and callbacks into single, shared native observer instances, dramatically reducing CPU/memory footprint and ensuring automatic cleanup on component unmount.

## 2026-07-15 - Eliminate Layout Thrashing with DOM Scheduler (measure/mutate)
**Learning:** Mixing DOM reads (like `getBoundingClientRect()`, `offsetWidth`) and DOM writes (like `element.style.transform`) inside the same animation frame or component lifecycle causes forced synchronous layouts, leading to severe layout thrashing. Older guidelines suggested manually deferring reads outside of rAF entirely.
**Action:** Use Gia's FastDOM-inspired scheduler to safely batch operations inside frames. Wrap all DOM reads in `gia.measure(() => { ... })` and all DOM writes in `gia.mutate(() => { ... })`. The scheduler guarantees that all measures across the entire page execute before any mutates in a single `requestAnimationFrame` tick, mathematically preventing layout thrashing without needing to extract reads to external events.
## 2025-02-18 - Fix memory leak in array mutation using backward for loop
**Learning:** When using a swap-and-pop pattern to remove items from an array in JavaScript, iterating over that same array using Array.prototype.forEach() causes elements to be skipped due to index shifting. This left lingering global scroll/resize event listeners attached after component destruction, creating a memory leak.
**Action:** Always use a standard backward for loop (e.g., for (let i = arr.length - 1; i >= 0; i--)) when an array might mutate itself (especially during cleanup functions) to ensure all items are processed without index skipping.
## 2026-10-25 - Avoid querySelectorAll in autoMount added nodes processing
**Learning:** Calling `loadComponents` on every newly added node via `MutationObserver` in `autoMount.js` means overhead scales linearly with the number of DOM insertions. `loadComponents` calls `querySelectorAll` which is slow.
**Action:** When tracking added nodes in the `MutationObserver`, filter them by checking if the node is or contains a component before adding them to the tracking set (`node.hasAttribute(attrName) || node.querySelector(...)`). This completely bypasses processing overhead for large blocks of plain HTML insertions.
