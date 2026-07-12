## 2025-06-02 - Added Focus Visible State to Tabs Component
**Learning:** Custom tab implementations often handle keydown events manually to navigate between tabs, but frequently overlook the need for a distinct visual focus indicator (`:focus-visible`) on the tab elements themselves, making keyboard navigation difficult to track visually.
**Action:** Always ensure that any custom interactive element that can receive keyboard focus (like tabs, custom buttons, or toggle switches) has a clear `:focus-visible` outline applied in CSS.

## 2025-07-25 - Added aria-hidden to Decorative SVGs
**Learning:** Decorative `<svg>` icons located inside interactive elements (like buttons or links) that already derive their accessible name from inner text or an `aria-label` should have `aria-hidden="true"` to prevent screen readers from redundantly announcing their contents.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within interactive elements to improve screen reader experience.

## 2025-08-16 - File Dropzone Focus Visibility
**Learning:** To maintain keyboard accessibility for file upload dropzones with a visually hidden `<input type="file">` (e.g., `opacity: 0`), relying purely on `:focus-within` CSS styles might not be completely robust for testing environments like Playwright or some screen readers because they consider visually hidden inputs non-actionable.
**Action:** Always augment `:focus-within` by toggling an `is-focused` class via JS `focus`/`blur` events on the parent container. Additionally, always link the container's `<label>` to the input using matching `for` and `id` attributes.

## 2025-09-01 - UploadField Keyboard Actionability
**Learning:** For custom file dropzones (like UploadField) where the actual file input is visually hidden, adding `is-focused` styles via focus events on the input is good, but it's not enough for keyboard actionability. If a user tabs to the dropzone or its container, they need to be able to trigger the file picker using keyboard keys ('Enter' or 'Space'), as the native input isn't directly interactable via the standard click area.
**Action:** Always add `tabindex="0"` to custom file dropzone containers and implement a `keydown` listener that catches 'Enter' and 'Space' keys to programmatically trigger a click on the hidden file input.

## 2025-10-15 - Added Focus Visible State to Slider Buttons
**Learning:** Custom slider control buttons (.slider-btn) were missing keyboard focus indicators, making them difficult to operate for keyboard users.
**Action:** Always add a clear `:focus-visible` outline to custom interactive elements, especially icon-only control buttons, to ensure keyboard accessibility.
## 2025-11-20 - Added Focus Visible State to ThemeToggle Button
**Learning:** Custom icon-only toggle buttons like `ThemeToggle` often lack explicit focus indicators in their baseline styles, making keyboard navigation difficult to track visually as users tab through interactive elements on the page.
**Action:** Always ensure a clear `:focus-visible` outline is applied in CSS for custom interactive elements, especially icon-only control buttons, to ensure robust keyboard accessibility.

## 2025-06-03 - Added Focus Visible State to ClipboardCopy Button
**Learning:** Custom buttons like `ClipboardCopy` can lack explicit focus indicators in their baseline styles, making keyboard navigation difficult to track visually.
**Action:** Always ensure a clear `:focus-visible` outline is applied in CSS for custom interactive elements, especially utility buttons.

## 2023-10-27 - Add missing focus visible indicator to standard anchor tags
**Learning:** Basic elements such as standard anchor tags (`<a>`) used within the page structure (e.g. Navigation) might lack visual indicators when navigating with a keyboard if a CSS reset is in place without explicit fallbacks.
**Action:** Always ensure basic interactive elements have global CSS rules providing explicit focus indicators, like `outline: 2px solid`, when relying on keyboard navigation.
