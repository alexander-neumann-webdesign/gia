## 2025-06-02 - Always add :focus-visible to Custom Interactive Elements
**Learning:** Custom interactive components (like Tabs, Slider controls, ThemeToggles, and utility buttons) often lack explicit focus indicators in their baseline styles, making keyboard navigation difficult to track visually as users tab through the page.
**Action:** Always ensure a clear `:focus-visible` outline is applied in CSS for any custom interactive element, especially icon-only control buttons, to ensure robust keyboard accessibility.

## 2025-07-25 - Added aria-hidden to Decorative SVGs
**Learning:** Decorative `<svg>` icons located inside interactive elements (like buttons or links) that already derive their accessible name from inner text or an `aria-label` should have `aria-hidden="true"` to prevent screen readers from redundantly announcing their contents.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within interactive elements to improve screen reader experience.

## 2025-08-16 - File Dropzone Focus Visibility
**Learning:** To maintain keyboard accessibility for file upload dropzones with a visually hidden `<input type="file">` (e.g., `opacity: 0`), relying purely on `:focus-within` CSS styles might not be completely robust for testing environments like Playwright or some screen readers because they consider visually hidden inputs non-actionable.
**Action:** Always augment `:focus-within` by toggling an `is-focused` class via JS `focus`/`blur` events on the parent container. Additionally, always link the container's `<label>` to the input using matching `for` and `id` attributes.

## 2025-09-01 - UploadField Keyboard Actionability
**Learning:** For custom file dropzones (like UploadField) where the actual file input is visually hidden, adding `is-focused` styles via focus events on the input is good, but it's not enough for keyboard actionability. If a user tabs to the dropzone or its container, they need to be able to trigger the file picker using keyboard keys ('Enter' or 'Space'), as the native input isn't directly interactable via the standard click area.
**Action:** Always add `tabindex="0"` to custom file dropzone containers and implement a `keydown` listener that catches 'Enter' and 'Space' keys to programmatically trigger a click on the hidden file input.
## 2024-03-12 - Modal Close Button ARIA & Focus
**Learning:** For a generic Modal component, relying solely on button text like "Close" or an icon isn't sufficient for screen reader context if the modal title isn't explicitly linked. Also, CSS resets often strip native outlines, and relying on basic `outline` without `outline-offset` can cause visual clipping on tight elements.
**Action:** Always ensure modal close buttons have an explicit `aria-label="Close modal"` (or similar contextual label) injected dynamically if missing, and always define an explicit `:focus-visible` rule with `outline-offset` in the component's base CSS.

## 2025-10-18 - Toaster Close Button ARIA
**Learning:** Adding `aria-hidden="true"` to decorative SVGs inside components with descriptive text or labels ensures a smoother screen reader experience by preventing redundant announcements.
**Action:** Always add `aria-hidden="true"` to decorative SVGs within interactive elements.
