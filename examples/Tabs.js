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
			this.observeResize(this.ref.tabList, () => {
				this.updateIndicator();
			});
		}
	}

	unmount() {
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
			case 'Enter':
			case ' ':
				event.preventDefault();
				if (this.state.activeTabIndex !== currentIndex) {
					this.setState({ activeTabIndex: currentIndex });
				}
				return;
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

	_updateDOM(activeIndex) {
		this.updateIndicator();

		// Update Tabs
		this.ref.tab.forEach((tab, index) => {
			const isSelected = index === activeIndex;
			tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');

			if (isSelected) {
				tab.setAttribute('tabindex', '0');
			} else {
				tab.setAttribute('tabindex', '-1');
			}
		});
		
		// Update Panels (only used for immediate switching now without animation)
		this.ref.panel.forEach((panel, index) => {
			const activeTab = this.ref.tab[activeIndex];
			const controlsId = activeTab ? activeTab.getAttribute('aria-controls') : null;

			if (controlsId) {
				panel.hidden = (panel.id !== controlsId);
			} else {
				panel.hidden = (index !== activeIndex);
			}
		});
	}

	_animateTransition(panelsContainer, oldIndex, newIndex, direction) {
		const currentAnimId = ++this._animationId || 1;
		this._animationId = currentAnimId;

		// Measure start height (catches the container mid-animation if interrupted)
		const startHeight = panelsContainer.offsetHeight;

		// Reset all ongoing animations and inline styles
		panelsContainer.getAnimations().forEach(a => a.cancel());
		panelsContainer.style.height = '';
		panelsContainer.style.overflow = '';
		panelsContainer.style.position = '';

		const oldPanel = this.ref.panel[oldIndex];
		const newPanel = this.ref.panel[newIndex];

		this.ref.panel.forEach((panel, index) => {
			panel.getAnimations().forEach(a => a.cancel());
			
			// Ensure only the panel we are transitioning FROM is initially visible
			panel.hidden = (index !== oldIndex);
			
			// FIX: Any panel that is NOT the new target panel must be absolutely positioned
			// so it doesn't expand the grid cell and mess up the endHeight measurement!
			if (panel !== newPanel) {
				panel.style.position = 'absolute';
				panel.style.top = '0';
				panel.style.left = '0';
				panel.style.width = '100%';
			} else {
				panel.style.position = '';
				panel.style.top = '';
				panel.style.left = '';
				panel.style.width = '';
			}
		});

		// Prepare DOM for new state
		this.updateIndicator();
		
		this.ref.tab.forEach((tab, index) => {
			const isSelected = index === newIndex;
			tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
			tab.setAttribute('tabindex', isSelected ? '0' : '-1');
		});

		if (newPanel) newPanel.hidden = false;

		// Measure end height (now accurately determined ONLY by newPanel)
		const endHeight = panelsContainer.offsetHeight;

		// Lock container size for animation
		panelsContainer.style.overflow = 'hidden';
		panelsContainer.style.height = `${startHeight}px`;
		panelsContainer.style.position = 'relative';

		const animations = [];

		// 1. Container Height Animation
		if (startHeight !== endHeight) {
			const heightAnim = panelsContainer.animate(
				[ { height: `${startHeight}px` }, { height: `${endHeight}px` } ],
				{ duration: 300, easing: 'ease', fill: 'forwards' }
			);
			animations.push(heightAnim.finished);
		}

		// 2. Old Panel Fade & Slide Out
		if (oldPanel) {
			const oldAnim = oldPanel.animate(
				[
					{ opacity: 1, transform: 'translateX(0px)' },
					{ opacity: 0, transform: `translateX(${direction > 0 ? -20 : 20}px)` }
				],
				{ duration: 250, easing: 'ease', fill: 'forwards' }
			);
			animations.push(oldAnim.finished);
		}

		// 3. New Panel Fade & Slide In
		if (newPanel) {
			const newAnim = newPanel.animate(
				[
					{ opacity: 0, transform: `translateX(${direction > 0 ? 20 : -20}px)` },
					{ opacity: 1, transform: 'translateX(0px)' }
				],
				{ duration: 300, easing: 'ease', fill: 'forwards' }
			);
			animations.push(newAnim.finished);
		}

		Promise.allSettled(animations).then(() => {
			if (this._animationId !== currentAnimId) return;

			// Cleanup
			this.ref.panel.forEach((panel) => {
				panel.getAnimations().forEach(a => a.cancel());
				if (panel !== newPanel) {
					panel.hidden = true;
				}
				panel.style.position = '';
				panel.style.top = '';
				panel.style.left = '';
				panel.style.width = '';
			});

			panelsContainer.getAnimations().forEach(a => a.cancel());
			panelsContainer.style.height = '';
			panelsContainer.style.overflow = '';
			panelsContainer.style.position = '';
			this.element.removeAttribute('data-direction');
		});
	}

	stateChange(stateChanges) {
		if ('activeTabIndex' in stateChanges) {
			const activeIndex = stateChanges.activeTabIndex;
			const oldIndex = this._currentActiveIndex;

			if (activeIndex === oldIndex) return;

			const direction = oldIndex !== undefined ? (activeIndex > oldIndex ? 1 : -1) : 0;
			this._currentActiveIndex = activeIndex;

			if (direction !== 0) {
				this.element.setAttribute('data-direction', direction > 0 ? 'forward' : 'backward');
			}

			const panelsContainer = this.ref.panel[0]?.parentElement;

			// If we have an old state, a container, and browser supports WAAPI, animate it
			if (panelsContainer && oldIndex !== undefined && panelsContainer.animate) {
				this._animateTransition(panelsContainer, oldIndex, activeIndex, direction);
			} else {
				this._updateDOM(activeIndex);
			}
		}
	}
}

gia.register(Tabs);

/*
========================================
EXPECTED HTML
========================================

<div data-component="Tabs">
  <div role="tablist" aria-orientation="horizontal" aria-label="Sample Tabs">
    <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">Tab 1</button>
    <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabindex="-1">Tab 2</button>
  </div>
  <div class="tab-panels">
    <div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
      <p>Panel 1 content</p>
    </div>
    <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
      <p>Panel 2 content</p>
    </div>
  </div>
</div>

========================================
SUGGESTED SCSS
========================================

div[data-component="Tabs"] {
  .tab-panels {
    display: grid;
    grid-template-columns: 1fr;

    > * {
      grid-row-start: 1;
      grid-column-start: 1;
    }
  }

  [role="tab"] {
    cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: border-color 0.3s ease, color 0.3s ease;

    &[aria-selected="true"] {
      border-color: currentColor;
      font-weight: bold;
    }
  }

  [role="tabpanel"] {
    // Modern discrete transition
    transition: opacity 0.4s ease, display 0.4s allow-discrete;
    opacity: 1;

    &[hidden] {
      opacity: 0;
      display: none;
    }

    @starting-style {
      &:not([hidden]) {
        opacity: 0;
      }
    }
  }
}
*/
