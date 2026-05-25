## 2025-02-23 - Added aria-hidden to Decorative SVGs
**Learning:** Decorative SVG icons inside interactive elements (like buttons with text or aria-labels) must explicitly set `aria-hidden="true"`. Without this, screen readers may attempt to read the SVG's internal paths or announce an unlabeled element, confusing visually impaired users.
**Action:** Always verify if an SVG conveys semantic meaning. If the parent element handles the accessible name (via text or `aria-label`), add `aria-hidden="true"` to the SVG.
## 2026-05-25 - Accessible Hidden File Dropzones
**Learning:** When styling file dropzones with a visually hidden `<input type="file">` (using `opacity: 0`), keyboard users lose the visual focus indicator when tabbing to the input. Additionally, the label must be explicitly linked with `for` and `id` for screen readers.
**Action:** Use the `:focus-within` pseudo-class on the parent dropzone container to provide a visible focus ring (e.g., outline) when the hidden input receives keyboard focus, and always ensure `<label for="id">` matches the input.
