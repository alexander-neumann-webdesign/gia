class Tabs extends gia.Component {
	constructor(element) {
		super(element);

		this.tabList = this.element.querySelector('[role="tablist"]');
		this.tabs = Array.from(this.element.querySelectorAll('[role="tab"]'));
		this.panels = Array.from(this.element.querySelectorAll('[role="tabpanel"]'));
	}

	mount() {
		if (!this.tabList || this.tabs.length === 0 || this.panels.length === 0) {
			console.warn("Tabs component is missing required ARIA roles ([role='tablist'], [role='tab'], [role='tabpanel']).");
			return;
		}

		// Initialize state based on DOM. If none active, activate first.
		let hasActive = false;
		this.tabs.forEach((tab) => {
			tab.addEventListener('click', this.handleClick);
			tab.addEventListener('keydown', this.handleKeydown);

			if (tab.getAttribute('aria-selected') === 'true') {
				hasActive = true;
				this.activateTab(tab, false); // false = don't focus
			} else {
				tab.setAttribute('tabindex', '-1');
			}
		});

		if (!hasActive && this.tabs.length > 0) {
			this.activateTab(this.tabs[0], false);
		}
	}

	unmount() {
		this.tabs.forEach((tab) => {
			tab.removeEventListener('click', this.handleClick);
			tab.removeEventListener('keydown', this.handleKeydown);
		});
	}

	handleClick(event) {
		const targetTab = event.currentTarget;
		this.activateTab(targetTab, true);
	}

	handleKeydown(event) {
		const currentTab = event.currentTarget;
		let newTab = null;

		// Determine tab orientation
		const isVertical = this.tabList.getAttribute('aria-orientation') === 'vertical';

		const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
		const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

		const currentIndex = this.tabs.indexOf(currentTab);

		switch (event.key) {
			case nextKey:
				event.preventDefault();
				newTab = this.tabs[(currentIndex + 1) % this.tabs.length];
				break;
			case prevKey:
				event.preventDefault();
				newTab = this.tabs[(currentIndex - 1 + this.tabs.length) % this.tabs.length];
				break;
			case 'Home':
				event.preventDefault();
				newTab = this.tabs[0];
				break;
			case 'End':
				event.preventDefault();
				newTab = this.tabs[this.tabs.length - 1];
				break;
		}

		if (newTab) {
			this.activateTab(newTab, true);
		}
	}

	activateTab(tabToActivate, setFocus = true) {
		// Deactivate all
		this.tabs.forEach(tab => {
			tab.setAttribute('aria-selected', 'false');
			tab.setAttribute('tabindex', '-1');
		});

		this.panels.forEach(panel => {
			panel.hidden = true;
		});

		// Activate selected
		tabToActivate.setAttribute('aria-selected', 'true');
		tabToActivate.removeAttribute('tabindex');

		if (setFocus) {
			tabToActivate.focus();
		}

		// Show corresponding panel
		const controlsId = tabToActivate.getAttribute('aria-controls');
		if (controlsId) {
			const panel = document.getElementById(controlsId);
			if (panel) {
				panel.hidden = false;
			}
		} else {
			// Fallback: match by index if no aria-controls is set
			const index = this.tabs.indexOf(tabToActivate);
			if (this.panels[index]) {
				this.panels[index].hidden = false;
			}
		}
	}
}

gia.register(Tabs);
