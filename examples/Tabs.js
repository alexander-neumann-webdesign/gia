class Tabs extends gia.Component {
	constructor(element) {
		super(element);

		this._id = Math.random().toString(36).substring(2, 9);

		this.ref = {
			tabList: null, // [role="tablist"] could be mapped to this, or explicitly marked
			tab: [],       // [role="tab"]
			panel: []      // [role="tabpanel"]
		};

		this.setState({
			activeTabIndex: -1
		});

		this.updateIndicator = this.updateIndicator.bind(this);
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

		// Store bound functions for cleanup
		this.tabClickHandlers = [];
		this.tabKeydownHandlers = [];

		this.ref.tab.forEach((tab, index) => {
			const clickHandler = (e) => this.handleClick(e, index);
			const keydownHandler = (e) => this.handleKeydown(e, index);

			this.tabClickHandlers.push(clickHandler);
			this.tabKeydownHandlers.push(keydownHandler);

			tab.addEventListener('click', clickHandler);
			tab.addEventListener('keydown', keydownHandler);

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

		if (this.ref.tabList) {
			this.resizeObserver = new ResizeObserver(() => {
				this.updateIndicator();
			});
			this.resizeObserver.observe(this.ref.tabList);
		}
	}

	unmount() {
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
			this.resizeObserver = null;
		}

		this.ref.tab.forEach((tab, index) => {
			if (this.tabClickHandlers[index]) {
				tab.removeEventListener('click', this.tabClickHandlers[index]);
			}
			if (this.tabKeydownHandlers[index]) {
				tab.removeEventListener('keydown', this.tabKeydownHandlers[index]);
			}
		});

		this.tabClickHandlers = [];
		this.tabKeydownHandlers = [];
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

	updateIndicator() {
		const activeIndex = this.state.activeTabIndex;
		const activeTab = this.ref.tab[activeIndex];

		if (activeTab && this.ref.tabList) {
			const left = activeTab.offsetLeft;
			const width = activeTab.offsetWidth;

			this.ref.tabList.style.setProperty('--indicator-left', `${left}px`);
			this.ref.tabList.style.setProperty('--indicator-width', `${width}px`);
		}
	}

	stateChange(stateChanges) {
		if ('activeTabIndex' in stateChanges) {
			const activeIndex = stateChanges.activeTabIndex;

			const updateDOM = () => {
				this.updateIndicator();

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
			};

			const panelsContainer = this.ref.panel[0]?.parentElement;

			if (document.startViewTransition && panelsContainer) {
				const activePanel = this.ref.panel[activeIndex];
				const oldPanel = this.ref.panel.find(p => !p.hidden);

				panelsContainer.style.viewTransitionName = `tabs-container-${this._id}`;
				if (oldPanel && oldPanel !== activePanel) {
					oldPanel.style.viewTransitionName = `tabs-panel-${this._id}-old`;
				}
				if (activePanel) {
					activePanel.style.viewTransitionName = `tabs-panel-${this._id}-new`;
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
		}
	}
}

gia.register(Tabs);

/**
 * Expected HTML Structure:
 *
 * <div data-component="Tabs">
 *   <div role="tablist" aria-orientation="horizontal" aria-label="Sample Tabs">
 *     <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">Tab 1</button>
 *     <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabindex="-1">Tab 2</button>
 *   </div>
 *   <div class="tab-panels">
 *     <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
 *       <p>Panel 1 content</p>
 *     </div>
 *     <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
 *       <p>Panel 2 content</p>
 *     </div>
 *   </div>
 * </div>
 *
 * Suggested SCSS:
 *
 * div[data-component="Tabs"] {
 *   .tab-panels {
 *     display: grid;
 *     grid-template-columns: 1fr;
 *
 *     > * {
 *       grid-row-start: 1;
 *       grid-column-start: 1;
 *     }
 *   }
 *
 *   [role="tab"] {
 *     cursor: pointer;
 *     border-bottom: 2px solid transparent;
 *     transition: border-color 0.3s ease, color 0.3s ease;
 *
 *     &[aria-selected="true"] {
 *       border-color: currentColor;
 *       font-weight: bold;
 *     }
 *   }
 *
 *   [role="tabpanel"] {
 *     // Modern discrete transition
 *     transition: opacity 0.4s ease, display 0.4s allow-discrete;
 *     opacity: 1;
 *
 *     &[hidden] {
 *       opacity: 0;
 *       display: none;
 *     }
 *
 *     @starting-style {
 *       &:not([hidden]) {
 *         opacity: 0;
 *       }
 *     }
 *   }
 * }
 */
