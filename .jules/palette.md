## 2025-06-02 - Added Focus Visible State to Tabs Component
**Learning:** Custom tab implementations often handle keydown events manually to navigate between tabs, but frequently overlook the need for a distinct visual focus indicator (`:focus-visible`) on the tab elements themselves, making keyboard navigation difficult to track visually.
**Action:** Always ensure that any custom interactive element that can receive keyboard focus (like tabs, custom buttons, or toggle switches) has a clear `:focus-visible` outline applied in CSS.

## 2025-07-25 - Added aria-hidden to Decorative SVGs
**Learning:** Decorative `<svg>` icons located inside interactive elements (like buttons or links) that already derive their accessible name from inner text or an `aria-label` should have `aria-hidden="true"` to prevent screen readers from redundantly announcing their contents.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within interactive elements to improve screen reader experience.
## 2024-06-13 - [Add keyboard focus state to UploadField component]
**Learning:** Custom file upload dropzones often hide the native file input, making keyboard navigation difficult as focus indicators are lost.
**Action:** When creating custom upload fields, bind `focus` and `blur` events to the hidden native file input to toggle an `is-focused` class on the visible dropzone parent container, ensuring keyboard users receive visual feedback.
