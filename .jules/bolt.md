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
## 2026-05-22 - Refactored complex monolithic stateChange method in Tabs.js into smaller helper methods.
**Learning:** Encapsulating complex logic (especially those that mix DOM updates, View Transitions, and procedural animations) into smaller, well-named helper methods drastically improves readability and maintainability without sacrificing performance.
**Action:** When working with large `stateChange` or `render` functions, explicitly break down sequential tasks (e.g. `_updateDOM`, `_measureTargetHeight`, `_applyViewTransition`) into separate private methods.
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

## 2024-05-22 - Avoid Layout Reads in rAF & Eliminate Getter Overhead
**Learning:** Performing layout reads (like `getBoundingClientRect()`) inside `requestAnimationFrame` loops or using a dirty flag to defer them can cause severe layout thrashing. Additionally, accessing properties via getters (like `this.options` or `this.ref`) inside high-frequency animation loops adds unnecessary function call overhead on every frame.
**Action:** Move layout reads out of rAF loops and perform them synchronously inside observer callbacks (like `ResizeObserver` or `IntersectionObserver`). In performance-critical hot paths, bypass getter methods and access underlying properties directly (e.g., `this._options`, `this._ref`) to eliminate overhead.

## 2024-05-22 - Defer Layout-Trashing Events out of rAF
**Learning:** Dispatching a global `resize` event synchronously from within a `requestAnimationFrame` loop (like inside a component's `stateChange` method) forces all resize listeners in the application to fire immediately. If any of those listeners perform DOM layout reads (e.g., `getBoundingClientRect()`), it causes synchronous layout thrashing and severe frame drops.
**Action:** When a component needs to trigger a global layout update (like `window.dispatchEvent(new Event('resize'))`) in response to an animation or DOM change happening inside a `rAF` tick, always defer the event dispatch to the next task queue using `setTimeout(..., 0)`. This allows the browser to paint the current frame and complete the layout phase smoothly before listeners execute.
## 2026-05-22 - Optimize View Transitions API Snapshotting
**Learning:** When using the View Transitions API to animate filtering or updating large DOM lists, assigning a `view-transition-name` to all hidden elements forces the browser to unnecessarily snapshot and generate dummy pseudo-element trees for items that are completely invisible, causing severe performance degradation.
**Action:** Always conditionally wrap the assignment of `view-transition-name` for hidden elements (e.g., `if (!element.hidden) { element.style.viewTransitionName = ... }`) to ensure only elements actively transitioning out are processed by the browser's animation engine.
## 2024-05-22 - Refactor Duplicate Embla Slide Logic
**Learning:** Found identical nested looping logic to calculate the diffToTarget for each slide across multiple setup functions (like `setupTween` and `setupParallax`) inside the `Slider` component. This increases maintenance surface area and cognitive load.
**Action:** Extract the complex nested loops that iterate over Embla slides into a separate helper method (like `_applyEmblaEffect(embla, eventName, callback)`) to DRY out the code and reduce duplication, making it easier to add new scroll effects later.

## 2024-05-23 - Extracted ViewTransition Helper Methods
**Learning:** Functions like `_applyViewTransition` can quickly become overly complex when mixing DOM manipulations, setup for transition names and animations, and cleanup logic. Breaking these apart into smaller, distinct helper methods (`_setupViewTransitionNames`, `_animateContainerHeight`, `_cleanupViewTransition`) significantly improves readability and maintainability of the core animation flow.
**Action:** Always attempt to split complex, monolithic functions into smaller, single-purpose helper functions to ensure codebase maintainability.
## 2026-05-23 - Nested ForEach Closures in Hot Paths
**Learning:** High-frequency methods (like Embla `scroll` handlers or `requestAnimationFrame` loops) using nested array iteration methods like `.forEach()` allocate multiple inline closure functions on every frame. Over time, this creates measurable garbage collection overhead leading to micro-stutters.
**Action:** Always optimize high-frequency lifecycle and event loops by replacing `.forEach()` with standard `for` loops to completely eliminate closure function allocations.
## 2024-05-23 - Optimize Array allocations in component unmount lifecycle
**Learning:** `Array.prototype.forEach` creates closure functions for every item in the array, introducing unnecessary memory allocation. Converting it into a standard `for` loop in lifecycle methods like `unmount` or event hooks like `updateDots` prevents garbage collection (GC) churn.
**Action:** Replace `.forEach` with `for` loops in performance-sensitive places.

## 2024-05-24 - Debounce High Frequency Global Events in BaseComponent
**Learning:** Attaching native DOM listeners to high frequency events like `scroll` and `resize` without debouncing can cause the main thread to block, especially when there are many registered callbacks iterating synchronously.
**Action:** Always wrap the actual payload extraction and callback execution of high frequency global event listeners in a `requestAnimationFrame` call to decouple the event firing from the processing logic, thus preventing layout thrashing and jank.
