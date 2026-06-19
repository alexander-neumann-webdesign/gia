## 2025-06-02 - Added Focus Visible State to Tabs Component
**Learning:** Custom tab implementations often handle keydown events manually to navigate between tabs, but frequently overlook the need for a distinct visual focus indicator (`:focus-visible`) on the tab elements themselves, making keyboard navigation difficult to track visually.
**Action:** Always ensure that any custom interactive element that can receive keyboard focus (like tabs, custom buttons, or toggle switches) has a clear `:focus-visible` outline applied in CSS.

## 2025-07-25 - Added aria-hidden to Decorative SVGs
**Learning:** Decorative `<svg>` icons located inside interactive elements (like buttons or links) that already derive their accessible name from inner text or an `aria-label` should have `aria-hidden="true"` to prevent screen readers from redundantly announcing their contents.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within interactive elements to improve screen reader experience.

## 2025-08-14 - Keyboard focus for visually hidden inputs
**Learning:** File dropzones that use a visually hidden `<input type="file">` (e.g. \`opacity: 0\`) don't naturally show focus states when navigated to via keyboard, since the focused element is technically hidden. CSS \`:focus-within\` on the container often doesn't trigger depending on browser behavior with hidden elements.
**Action:** When creating dropzones with hidden file inputs, explicitly bind JS \`focus\` and \`blur\` events to the input to toggle a focus state class (like \`.is-focused\`) on the parent container, and combine that with CSS \`:focus-within\` and \`.is-focused\` selectors.
