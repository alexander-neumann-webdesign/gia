class Tabs extends gia.Component {
	constructor(element) {
		super(element);

		this.ref = {
			tabList: null, // [role="tablist"] could be mapped to this, or explicitly marked
			tab: [],       // [role="tab"]
			panel: []      // [role="tabpanel"]
		};

		this.setState({
			activeTabIndex: -1
		});
	}

	mount() {
		// If refs aren't mapped via data-ref attributes in the DOM,
		// we fallback to querying them manually to support native ARIA markup smoothly.
		if (!this.ref.tabList) {
			this.ref.tabList = this.element.querySelector('[role="tablist"]');
		}
		if (this.ref.tab.length === 0) {
			this.ref.tab = Array.from(this.element.querySelectorAll('[role="tab"]'));
		}
		if (this.ref.panel.length === 0) {
			this.ref.panel = Array.from(this.element.querySelectorAll('[role="tabpanel"]'));
		}

		if (!this.ref.tabList || this.ref.tab.length === 0 || this.ref.panel.length === 0) {
			console.warn("Tabs component is missing required ARIA roles or data-refs.");
			return;
		}

		// Initialize state based on DOM and URL hash.
		const hash = window.location.hash;
		let initialIndex = 0;
		let foundHashMatch = false;

		this.ref.tab.forEach((tab, index) => {
			tab.addEventListener('click', (e) => this.handleClick(e, index));
			tab.addEventListener('keydown', (e) => this.handleKeydown(e, index));

			// Check if URL hash matches the tab's ID or its controlled panel's ID
			const controlsId = tab.getAttribute('aria-controls');
			const tabId = tab.id;

			if (hash && ((tabId && hash === `#${tabId}`) || (controlsId && hash === `#${controlsId}`))) {
				initialIndex = index;
				foundHashMatch = true;
			} else if (!foundHashMatch && tab.getAttribute('aria-selected') === 'true') {
				initialIndex = index;
			}
		});

		if (this.ref.tab.length > 0) {
			this.setState({ activeTabIndex: initialIndex });

			if (foundHashMatch) {
				setTimeout(() => {
					this.element.scrollIntoView({ behavior: 'smooth' });
				}, 100);
			}
		}
	}

	unmount() {
		// Event listeners should ideally be bound using data-action, but inline binding here
		// requires a bit of manual cleanup, or we rely on node disposal.
		// For thoroughness, we'd remove them here if we saved references.
	}

	handleClick(event, index) {
		this.setState({ activeTabIndex: index });
		this.setFocus(index);
	}

	handleKeydown(event, currentIndex) {
		let newIndex = currentIndex;

		// Determine tab orientation
		const isVertical = this.ref.tabList.getAttribute('aria-orientation') === 'vertical';

		const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
		const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';
		const tabCount = this.ref.tab.length;

		switch (event.key) {
			case nextKey:
				event.preventDefault();
				newIndex = (currentIndex + 1) % tabCount;
				break;
			case prevKey:
				event.preventDefault();
				newIndex = (currentIndex - 1 + tabCount) % tabCount;
				break;
			case 'Home':
				event.preventDefault();
				newIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				newIndex = tabCount - 1;
				break;
		}

		if (newIndex !== currentIndex) {
			this.setState({ activeTabIndex: newIndex });
			this.setFocus(newIndex);
		}
	}

	setFocus(index) {
		const tab = this.ref.tab[index];
		if (tab) {
			// requestAnimationFrame ensures focus happens after stateChange finishes updating DOM
			requestAnimationFrame(() => {
				tab.focus();
			});
		}
	}

	stateChange(stateChanges) {
		if ('activeTabIndex' in stateChanges) {
			const activeIndex = stateChanges.activeTabIndex;

			// Update Tabs
			this.ref.tab.forEach((tab, index) => {
				const isSelected = index === activeIndex;
				tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');

				if (isSelected) {
					tab.removeAttribute('tabindex');
				} else {
					tab.setAttribute('tabindex', '-1');
				}
			});

			// Update Panels
			this.ref.panel.forEach((panel, index) => {
				// We assume panels are either 1:1 in index order, or matched by aria-controls.
				// For the simplest stateful approach, we match by index, or if aria-controls exists, we could find it.
				// Here we update based on index mapping if lengths match.
				const activeTab = this.ref.tab[activeIndex];
				const controlsId = activeTab ? activeTab.getAttribute('aria-controls') : null;

				if (controlsId) {
					panel.hidden = (panel.id !== controlsId);
				} else {
					panel.hidden = (index !== activeIndex);
				}
			});
		}
	}
}

gia.register(Tabs);
