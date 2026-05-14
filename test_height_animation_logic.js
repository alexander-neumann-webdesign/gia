const fs = require('fs');
let code = fs.readFileSync('examples/Tabs.js', 'utf8');
const replacement = `
			const panelsContainer = this.ref.panel[0]?.parentElement;

			if (document.startViewTransition && panelsContainer) {
				const activePanel = this.ref.panel[activeIndex];
				const oldPanel = this.ref.panel.find(p => !p.hidden);

				panelsContainer.style.viewTransitionName = \`tabs-container-\${this._id}\`;
				if (oldPanel && oldPanel !== activePanel) {
					oldPanel.style.viewTransitionName = \`tabs-panel-\${this._id}-old\`;
				}
				if (activePanel) {
					activePanel.style.viewTransitionName = \`tabs-panel-\${this._id}-new\`;
				}

				// Disable root transition to prevent full-page crossfade
				document.documentElement.style.viewTransitionName = 'none';

				const transition = document.startViewTransition(() => {
                    const startHeight = panelsContainer.offsetHeight;
                    updateDOM();
                    // Flush the new DOM to get the target height
                    panelsContainer.style.height = 'auto'; // ensure it can be read if fixed
                });

                transition.ready.then(() => {
                    // Set up height animation logic if possible with view transition API
                    // Or we could animate height directly before/after updateDOM
                });
`;

// wait, the problem says "when changing tabs and the height of the content changes, the height change should be smoothly animated."
// Instead of view transitions for height, or maybe adding to it... Wait, view transitions *do* animate size changes automatically if we let them.
// Let's check how the height of tab-panels behaves during the view transition.
