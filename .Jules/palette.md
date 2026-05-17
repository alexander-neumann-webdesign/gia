## 2025-05-15 - Added ImageComparison Range Slider Accessibility
**Learning:** Native input ranges that are visually hidden but still interactive via custom styling require explicit `:focus-visible` states using sibling CSS selectors so keyboard users know they have focus. Also, adding `aria-label` dynamically via JS if missing ensures screen readers announce the element correctly even if developers miss it in their markup.
**Action:** Always check custom slider components for explicit focus states and ensure fallback ARIA labels are added programmatically.

## 2025-05-15 - Added cursor: pointer to wrapping labels
**Learning:** Labels that wrap form inputs like checkboxes or radio buttons work implicitly as hit targets, but without `cursor: pointer`, it's not obvious to users that the text itself is clickable.
**Action:** Add `cursor: pointer` to `<label>` elements wrapping inputs to provide immediate visual feedback.

## 2025-05-17 - Prevent layout shifting when hiding scrollbars
**Learning:** When applying `overflow: hidden` to the `document.body` (e.g. for a Modal or OffCanvasMenu) to prevent scrolling behind the component, the browser scrollbar disappears, which causes a layout shift.
**Action:** Calculate the scrollbar width (`window.innerWidth - document.documentElement.clientWidth`) and apply it as `paddingRight` to `document.body` when disabling scroll. Make sure to reset this padding when re-enabling scroll.
