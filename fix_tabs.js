const fs = require('fs');

let code = fs.readFileSync('examples/Tabs.js', 'utf8');

const replacement = `
			const panelsContainer = this.ref.panel[0]?.parentElement;

			if (panelsContainer) {
				const startHeight = panelsContainer.offsetHeight;

				const doViewTransition = () => {
					if (document.startViewTransition) {
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

						const transition = document.startViewTransition(() => updateDOM());

						transition.ready.catch(() => {});
						transition.finished.catch(() => {
							// Ignore AbortError when rapid clicks interrupt an ongoing transition
						}).finally(() => {
							panelsContainer.style.viewTransitionName = '';
							if (oldPanel) {
								oldPanel.style.viewTransitionName = '';
							}
							if (activePanel) {
								activePanel.style.viewTransitionName = '';
							}
							document.documentElement.style.viewTransitionName = '';
						});
					} else {
						updateDOM();
					}
				};

				// To find the end height, we temporarily apply the new state, measure, then revert.
				// Wait, if we use Web Animations API on panelsContainer, we can just do it.
				// Let's force layout for start and end heights.

				// Apply new state to measure
				const previousHiddenStates = this.ref.panel.map(p => p.hidden);

				// Update DOM without view transition just to measure
				updateDOM();

				// The height might be affected by CSS transitions if display goes from block to none,
				// but since display: none removes it from flow, the grid height should shrink.
				// However, if the old panel is still transitioning, its height might keep the grid tall.
				// To get pure target height, we could temporarily disable transitions, or just read offsetHeight
				// if transitions haven't started (they start in the next tick usually).
				const endHeight = panelsContainer.offsetHeight;

				// Revert state
				this.ref.panel.forEach((p, i) => p.hidden = previousHiddenStates[i]);

				// Now apply state properly (with view transition)
				doViewTransition();

				if (startHeight !== endHeight) {
					// We need to animate the height.
					// Since the old element might take time to fade out (due to CSS transition),
					// and grid height takes the max, the container height naturally won't shrink
					// until the fade out completes if it was the taller element.
					// If we animate the container height explicitly, it will force the container size.
					panelsContainer.style.overflow = 'hidden';
					const animation = panelsContainer.animate(
						[
							{ height: \`\${startHeight}px\` },
							{ height: \`\${endHeight}px\` }
						],
						{
							duration: 400,
							easing: 'ease'
						}
					);

					animation.onfinish = () => {
						panelsContainer.style.overflow = '';
						panelsContainer.style.height = '';
					};
					animation.oncancel = () => {
						panelsContainer.style.overflow = '';
						panelsContainer.style.height = '';
					};
				}
			} else {
				updateDOM();
			}
`;

code = code.replace(
/			const panelsContainer = this\.ref\.panel\[0\]\?\.parentElement;[\s\S]*?updateDOM\(\);\n			\}/,
replacement
);

fs.writeFileSync('examples/Tabs.js', code);
