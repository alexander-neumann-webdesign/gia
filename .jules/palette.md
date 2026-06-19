## 2025-06-02 - Added Focus Visible State to Tabs Component
**Learning:** Custom tab implementations often handle keydown events manually to navigate between tabs, but frequently overlook the need for a distinct visual focus indicator (`:focus-visible`) on the tab elements themselves, making keyboard navigation difficult to track visually.
**Action:** Always ensure that any custom interactive element that can receive keyboard focus (like tabs, custom buttons, or toggle switches) has a clear `:focus-visible` outline applied in CSS.

## 2025-07-25 - Added aria-hidden to Decorative SVGs
**Learning:** Decorative `<svg>` icons located inside interactive elements (like buttons or links) that already derive their accessible name from inner text or an `aria-label` should have `aria-hidden="true"` to prevent screen readers from redundantly announcing their contents.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within interactive elements to improve screen reader experience.

## 2025-07-26 - Added Focus Visible State to UploadField
**Learning:** Custom file upload dropzones often hide the native `<input type="file">` visually (e.g., using `opacity: 0` and absolute positioning). This hides the browser's default focus ring, making it impossible for keyboard users to know when the dropzone has focus.
**Action:** Always listen for `focus` and `blur` events on the visually hidden file input, and apply a visible focus state class (like `.is-focused` mapping to `:focus-visible` styles) to the parent dropzone container.
