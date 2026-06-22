## 2025-06-02 - Added Focus Visible State to Tabs Component
**Learning:** Custom tab implementations often handle keydown events manually to navigate between tabs, but frequently overlook the need for a distinct visual focus indicator (`:focus-visible`) on the tab elements themselves, making keyboard navigation difficult to track visually.
**Action:** Always ensure that any custom interactive element that can receive keyboard focus (like tabs, custom buttons, or toggle switches) has a clear `:focus-visible` outline applied in CSS.

## 2025-07-25 - Added aria-hidden to Decorative SVGs
**Learning:** Decorative `<svg>` icons located inside interactive elements (like buttons or links) that already derive their accessible name from inner text or an `aria-label` should have `aria-hidden="true"` to prevent screen readers from redundantly announcing their contents.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within interactive elements to improve screen reader experience.

## 2025-08-16 - File Dropzone Focus Visibility
**Learning:** To maintain keyboard accessibility for file upload dropzones with a visually hidden `<input type="file">` (e.g., `opacity: 0`), relying purely on `:focus-within` CSS styles might not be completely robust for testing environments like Playwright or some screen readers because they consider visually hidden inputs non-actionable.
**Action:** Always augment `:focus-within` by toggling an `is-focused` class via JS `focus`/`blur` events on the parent container. Additionally, always link the container's `<label>` to the input using matching `for` and `id` attributes.
