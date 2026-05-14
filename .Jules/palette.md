## 2024-10-25 - Self-contained UI Animations
**Learning:** Using the Web Animations API for component-injected SVGs ensures self-contained UX enhancements (like a loading spinner) without depending on the consuming application's external stylesheet to provide keyframes.
**Action:** When adding small animated UI enhancements to reusable components, prefer `element.animate()` to keep the component portable and dependency-free.
