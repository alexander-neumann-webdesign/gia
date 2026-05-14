const fs = require('fs');
let js = fs.readFileSync('examples/Tabs.js', 'utf8');

const newJS = js.replace(/stateChange\(stateChanges\) \{[\s\S]*?\}\n\t\}/, `stateChange(stateChanges) {
		if ('activeTabIndex' in stateChanges) {
			const activeIndex = stateChanges.activeTabIndex;

			const updateDOM = () => {
				this.updateIndicator();

				this.ref.tab.forEach((tab, index) => {
					const isSelected = index === activeIndex;
					tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
					if (isSelected) {
						tab.removeAttribute('tabindex');
					} else {
						tab.setAttribute('tabindex', '-1');
					}
				});

				this.ref.panel.forEach((panel, index) => {
					const activeTab = this.ref.tab[activeIndex];
					const controlsId = activeTab ? activeTab.getAttribute('aria-controls') : null;
					if (controlsId) {
						panel.hidden = (panel.id !== controlsId);
					} else {
						panel.hidden = (index !== activeIndex);
					}
				});
			};

			const panelsContainer = this.ref.panel[0]?.parentElement;

			if (panelsContainer && document.startViewTransition) {
				document.startViewTransition(() => updateDOM());
			} else {
				updateDOM();
			}
		}
	}`);

fs.writeFileSync('examples/Tabs.js', newJS);

let scss = fs.readFileSync('demo/demo.scss', 'utf8');
scss = scss.replace(/transition: opacity 0.4s ease, display 0.4s allow-discrete;[\s\S]*?@starting-style \{[\s\S]*?\}\n    \}/, '');

scss = scss.replace(/\.tab-panels \{/, `.tab-panels {\n    view-transition-name: tabs-container;\n`);
scss = scss.replace(/\[role="tabpanel"\] \{/, `[role="tabpanel"] {\n    &:not([hidden]) {\n      view-transition-name: tabs-panel-active;\n    }\n`);

fs.writeFileSync('demo/demo.scss', scss);
