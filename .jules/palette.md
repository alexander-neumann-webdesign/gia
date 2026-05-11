## 2024-05-11 - Add aria-expanded to OffCanvasMenu toggle
**Learning:** For overlay components like modals or off-canvas menus, standard components might add the click listener but fail to initialize ARIA attributes or track the component state back to the UI element triggering it.
**Action:** When adding or updating toggling UI elements in this repo, ensure `aria-controls` is set connecting the button to the menu and that `aria-expanded` is dynamically updated when the component state changes.
