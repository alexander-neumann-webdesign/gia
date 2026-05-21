## 2025-02-17 - Dynamic Form Feedback Requires Explicit ARIA Live Region Roles
**Learning:** Adding validation dynamically via Javascript often leaves screen readers unaware of the message visually rendered, e.g. success messages (`Thank you for your message`) or error alerts. Simply un-hiding an element is insufficient. We need explicit roles (`status` or `alert`) on these dynamically revealed messages.
**Action:** When implementing or updating Form components with custom dynamic validation/submission feedback, always ensure elements indicating success use `role="status"` and errors use `role="alert"`.

## 2026-05-21 - Form Validation Screen Reader Feedback
**Learning:** Native or custom HTML form validation feedback (like success or error messages) that is dynamically un-hidden via JS is not automatically announced by screen readers. This leaves visually impaired users unaware if a form submission succeeded or failed.
**Action:** Always add ARIA live region roles (`role="status"` for success/informative messages, `role="alert"` for critical/error messages) to dynamic feedback elements so screen readers can automatically announce the text when the element becomes visible.
