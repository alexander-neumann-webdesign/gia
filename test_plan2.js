const fs = require('fs');
let demoScss = fs.readFileSync('demo/demo.scss', 'utf8');

// I should actually change it differently.
// Just removing the height animation entirely using JS is the best.
// The snapping happens because we use max to calculate the grid height during transition.
// But we actually only care about smooth transition between tabs. ViewTransitions naturally fades them, but the layout shift causes snapping.

// Can I use CSS grid behavior?
// When the out-going element has display:none it immediately collapses, so grid size becomes new element size.
// If we use allow-discrete, both elements stay block during the 0.4s transition.
// Grid container height will be max(oldHeight, newHeight) for 0.4s.
// When transition ends, old element becomes display:none, grid height snaps to newHeight.
// This is exactly why it "snaps down and up".

// We can fix this by doing position:absolute on the outgoing element?
// Or we could use the Web Animations API but measure accurately.
// Why did the Web Animations API version have snapping?
// Because we measured old and new height by toggling `display` block/none, BUT `p.style.transition = 'none'` didn't disable `allow-discrete` correctly in JS? Wait, maybe it did.
// Let's trace back.
