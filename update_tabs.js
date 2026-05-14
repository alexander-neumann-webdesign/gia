const fs = require('fs');

let code = fs.readFileSync('examples/Tabs.js', 'utf8');

// We want to smoothly animate height using Web Animations API

const replacement = `
			const panelsContainer = this.ref.panel[0]?.parentElement;

			if (panelsContainer) {
				const startHeight = panelsContainer.offsetHeight;

				const updateWithViewTransition = () => {
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

						document.documentElement.style.viewTransitionName = 'none';

						const transition = document.startViewTransition(() => updateDOM());

						transition.ready.catch(() => {});
						transition.finished.catch(() => {}).finally(() => {
							panelsContainer.style.viewTransitionName = '';
							if (oldPanel) oldPanel.style.viewTransitionName = '';
							if (activePanel) activePanel.style.viewTransitionName = '';
							document.documentElement.style.viewTransitionName = '';
						});
					} else {
						updateDOM();
					}
				};

				updateWithViewTransition();

				const endHeight = panelsContainer.offsetHeight;

				if (startHeight !== endHeight) {
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
