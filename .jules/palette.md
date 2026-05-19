## 2024-05-11 - Add aria-expanded and aria-controls to Overlay Toggles
**Learning:** For overlay components like modals or off-canvas menus, standard components might add the click listener but fail to initialize ARIA attributes or track the component state back to the UI element triggering it.
**Action:** Always ensure that dynamically attached external UI triggers for modals/menus correctly initialize and continuously sync their `aria-controls` (connecting the button to the menu/dialog) and `aria-expanded` attributes with the component's internal state.

## 2026-05-12 - Stack tab panels for smooth transitions
**Learning:** When fading out an active tab and fading in a new tab simultaneously, not stacking them causes layout shifts where both are temporarily visible in flow.
**Action:** Wrap tab panels in a container and use `display: grid` with overlapping children (e.g., `grid-area: 1 / 1`) to ensure stable crossfade animations.

## 2024-05-18 - Accordion UX/A11y Fixes
**Learning:** For `<details>` and `<summary>` based Accordion components using `interpolate-size: allow-keywords` for CSS `height: auto` transitions, the `:root` selector must be global. Also, the `[open]` transition trigger must be placed outside the `@supports` block to ensure `height: auto` acts as a fallback for browsers that don't support `interpolate-size`.
**Action:** Fix SCSS nesting of `:root` within `@supports (interpolate-size: allow-keywords)`, ensuring it acts globally. Move `[open]` selector outside to ensure fallback functionality, and add `user-select: none` to the summary element.

## 2024-05-12 - SEO & Accessible Scroll Reveals
**Learning:** Using purely `opacity: 0` for scroll-reveal components hides content from search engines and can cause screen readers to read invisible content. Using `visibility: hidden` removes the element from the keyboard focus tree.
**Action:** Use `opacity: 0` alongside `pointer-events: none` to keep elements focusable via keyboard while preventing accidental mouse interactions. Restore `pointer-events: auto` upon reveal. Implement a `<noscript>` block to enforce `opacity: 1 !important` and `visibility: visible !important` as a fallback.

## 2024-05-18 - Prevent layout shift in stateful buttons
**Learning:** Buttons that change text on click can cause jarring layout shifts as their width recalculates.
**Action:** Use a CSS grid stacking trick. Wrap dynamic text and hidden "sizer" spans (containing all possible text variations with `aria-hidden="true"`) inside a container with `display: grid; grid-template-columns: 1fr;`. Apply `grid-row-start: 1; grid-column-start: 1;` to all children.

## 2026-05-13 - details/summary smooth height transition fix
**Learning:** When using `interpolate-size: allow-keywords` to smoothly transition native `<details>` elements from `height: 0` to `height: auto` using `::details-content`, the `::details-content` pseudo element must explicitly be set to `display: block`.
**Action:** Add `display: block` to the `::details-content` rule and update its transition string to `transition: height 0.5s ease, display 0.5s ease allow-discrete, content-visibility 0.5s ease allow-discrete;`.

## 2026-05-12 - Add ARIA labels to Slider navigation buttons
**Learning:** Slider components often use brief text like "Prev" or "Next", which might eventually be replaced by icon-only designs. Without proper `aria-label`s, context for screen readers can be ambiguous.
**Action:** Always ensure generic slider navigation controls include descriptive `aria-label` attributes (e.g., "Previous slide").

## 2025-02-15 - Tabs component playful transition
**Learning:** SASS nesting view-transition pseudo-elements like `::view-transition-group(*)` inside a parent selector breaks them. Also, the `viewTransitionName` must be given to BOTH the entering and exiting elements individually.
**Action:** Move view transition styles to the global scope. Assign unique `viewTransitionName` strings to both the `activePanel` (entering) and `oldPanel` (exiting) individually.

## 2024-05-18 - View Transitions Pointer Events Fix
**Learning:** During a View Transition, a `::view-transition` pseudo-element overlays the entire page, intercepting pointer events.
**Action:** Always add `pointer-events: none;` to the global `::view-transition` pseudo-element.

## 2024-05-18 - Redundant Screen Reader Text in Dynamic Buttons
**Learning:** When an icon-only button dynamically changes state and updates its `aria-label`, including visually hidden text (`.sr-only`) creates duplicate announcements.
**Action:** Rely solely on the dynamically updated `aria-label` on the button itself. Ensure injected SVGs have `aria-hidden="true"`.

## 2025-05-15 - Range Slider Accessibility and Labels
**Learning:** Native input ranges that are visually hidden but interactive require explicit `:focus-visible` states. Labels wrapping form inputs need `cursor: pointer`.
**Action:** Check custom slider components for explicit focus states (e.g. using sibling CSS selectors) and ensure fallback ARIA labels are added programmatically. Add `cursor: pointer` to `<label>` elements wrapping inputs.

## 2025-05-17 - Ensure Active Tabs Are Focusable
**Learning:** In custom tab implementations, using `element.removeAttribute('tabindex')` for the active tab only works for keyboard accessibility if the underlying element is natively focusable.
**Action:** Always set `tabindex="0"` on the active tab element explicitly rather than removing the attribute.

## 2025-05-18 - Hover Controls Keyboard Accessibility
**Learning:** Controls hidden via hover states (opacity: 0) remain invisible to keyboard users when focused unless the container also listens for focus-within.
**Action:** Always add `&:focus-within` alongside `&:hover` for hidden controls, and ensure an explicit `:focus-visible` outline is set.
