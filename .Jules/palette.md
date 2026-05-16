## 2025-05-15 - Added ImageComparison Range Slider Accessibility
**Learning:** Native input ranges that are visually hidden but still interactive via custom styling require explicit `:focus-visible` states using sibling CSS selectors so keyboard users know they have focus. Also, adding `aria-label` dynamically via JS if missing ensures screen readers announce the element correctly even if developers miss it in their markup.
**Action:** Always check custom slider components for explicit focus states and ensure fallback ARIA labels are added programmatically.

## 2025-05-16 - Theme Toggles are Switches, not Buttons
**Learning:** When building a component that toggles between two distinct states like 'light' and 'dark' mode, it should be treated as a switch (`role="switch"`, `aria-checked`) rather than a pressed button (`aria-pressed`). The `aria-label` should also be a static descriptor (e.g., 'Dark mode') instead of an action verb that changes based on the state.
**Action:** Use the `role="switch"` pattern for theme toggles to provide a more intuitive and standard experience for screen reader users.
