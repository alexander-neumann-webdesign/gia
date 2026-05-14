const fs = require('fs');

const demoScss = fs.readFileSync('demo/demo.scss', 'utf8');
let newDemoScss = demoScss.replace(/\.tab-panels \{\n    display: grid;/, `.tab-panels {
    display: grid;
    @supports (interpolate-size: allow-keywords) {
      height: max-content;
      transition: height 0.4s ease;
      overflow: hidden;
    }`);

newDemoScss = newDemoScss.replace(/&\[hidden\] \{\n      opacity: 0;\n      display: none;\n    \}/, `&[hidden] {
      opacity: 0;
      display: none;
      @supports (interpolate-size: allow-keywords) {
        margin-bottom: -100vh;
      }
    }`);

fs.writeFileSync('demo/demo.scss', newDemoScss);

const tabsJs = fs.readFileSync('examples/Tabs.js', 'utf8');
const newTabsJs = tabsJs.replace(/const panelsContainer = this\.ref\.panel\[0\]\?\.parentElement;[\s\S]*?\} else \{\n\t\t\t\tupdateDOM\(\);\n\t\t\t\}/, `const panelsContainer = this.ref.panel[0]?.parentElement;

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

						document.documentElement.style.viewTransitionName = 'none';

						const transition = document.startViewTransition(() => updateDOM());

						transition.ready.catch(() => {});
						transition.finished.catch(() => {
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

				// Fallback height animation if interpolate-size is not supported
				if (CSS.supports && !CSS.supports('interpolate-size', 'allow-keywords')) {
					const previousHiddenStates = this.ref.panel.map(p => p.hidden);

					this.ref.panel.forEach(p => {
						p.style.transition = 'none';
					});

					updateDOM();

					const endHeight = panelsContainer.offsetHeight;

					this.ref.panel.forEach((p, i) => p.hidden = previousHiddenStates[i]);

					void panelsContainer.offsetHeight;

					this.ref.panel.forEach(p => {
						p.style.transition = '';
					});

					doViewTransition();

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
					// Modern CSS will handle height animation
					doViewTransition();
				}
			} else {
				updateDOM();
			}`);

fs.writeFileSync('examples/Tabs.js', newTabsJs);
