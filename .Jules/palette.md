## 2025-05-15 - Added ImageComparison Range Slider Accessibility
**Learning:** Native input ranges that are visually hidden but still interactive via custom styling require explicit `:focus-visible` states using sibling CSS selectors so keyboard users know they have focus. Also, adding `aria-label` dynamically via JS if missing ensures screen readers announce the element correctly even if developers miss it in their markup.
**Action:** Always check custom slider components for explicit focus states and ensure fallback ARIA labels are added programmatically.
