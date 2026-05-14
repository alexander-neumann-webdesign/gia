class Accordion extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			closeOthers: false, // If true, only one accordion item can be open at a time within the same group
			icon: 'plus', // 'plus', 'arrow', or 'none'
		};

		this.ref = {
			summary: null // Optional: if you specifically want to reference the summary
		};

		this.isDetails = this.element.tagName.toLowerCase() === 'details';
		if (!this.isDetails) {
			console.warn("Accordion: Component should be attached to a <details> element.");
		}

		// Initial state is correctly set from element initially or open attribute
		this.setState({
			isOpen: this.element.hasAttribute('open')
		});
	}

	getIconSvg(iconType) {
		if (iconType === 'plus') {
			return `
				<svg class="accordion-icon accordion-icon--plus" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<line x1="12" y1="5" x2="12" y2="19" class="vertical-line"></line>
					<line x1="5" y1="12" x2="19" y2="12" class="horizontal-line"></line>
				</svg>
			`;
		} else if (iconType === 'arrow') {
			return `
				<svg class="accordion-icon accordion-icon--arrow" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
					<polyline points="6 9 12 15 18 9"></polyline>
				</svg>
			`;
		}
		return '';
	}

	mount() {
		if (!this.isDetails) return;

		// Inject icon into summary if not present and icon !== 'none'
		const summary = this.element.querySelector('summary');
		if (summary && this.options.icon !== 'none') {
			if (!summary.querySelector('.accordion-icon')) {
				summary.insertAdjacentHTML('beforeend', this.getIconSvg(this.options.icon));
			}
		}

		this.element.addEventListener('toggle', this.handleToggle);

		if (this.options.closeOthers) {
			window.addEventListener('accordion:open', this.handleAccordionOpen);
		}

		// Initial state based on URL hash or DOM
		const hash = window.location.hash;
		let shouldBeOpen = this.element.open;

		if (hash && this.element.id && hash === `#${this.element.id}`) {
			shouldBeOpen = true;

			// Optional: Scroll to the element if requested by hash
			setTimeout(() => {
				this.element.scrollIntoView({ behavior: 'smooth' });
			}, 100);
		}

		this.setState({ isOpen: shouldBeOpen });
	}

	unmount() {
		if (this.isDetails) {
			this.element.removeEventListener('toggle', this.handleToggle);
		}

		if (this.options.closeOthers) {
			window.removeEventListener('accordion:open', this.handleAccordionOpen);
		}
	}

	handleToggle(event) {
		// Only update state if it doesn't match the element's actual state
		// This prevents infinite loops since stateChange might alter element.open
		if (this.state.isOpen !== this.element.open) {
			this.setState({ isOpen: this.element.open });
		}
	}

	handleAccordionOpen(event) {
		const { instance, parent } = event.detail;

		if (instance !== this && parent === this.element.parentElement && this.state.isOpen) {
			this.setState({ isOpen: false });
		}
	}

	stateChange(stateChanges) {
		if ('isOpen' in stateChanges) {
			const { isOpen } = stateChanges;

			// Sync DOM if necessary
			if (this.element.open !== isOpen) {
				this.element.open = isOpen;
			}

			// Dispatch event for other accordions
			if (isOpen && this.options.closeOthers) {
				const customEvent = new CustomEvent('accordion:open', {
					detail: { instance: this, parent: this.element.parentElement }
				});
				window.dispatchEvent(customEvent);
			}
		}
	}
}

gia.register(Accordion);

/**
 * Expected HTML Structure:
 *
 * <details data-component="Accordion" id="faq-1">
 *   <summary>Question title</summary>
 *   <div class="content">
 *     <p>Answer content goes here.</p>
 *   </div>
 * </details>
 *
 * Suggested SCSS:
 *
 * // Ensure interpolate-size is available globally for parsers
 * :root {
 *   interpolate-size: allow-keywords;
 * }
 *
 * details[data-component="Accordion"] {
 *   @supports (interpolate-size: allow-keywords) {
 *     &::details-content {
 *       transition: height 0.5s ease, opacity 0.5s ease, display 0.5s ease allow-discrete, content-visibility 0.5s ease allow-discrete;
 *       height: 0;
 *       opacity: 0;
 *       overflow: clip;
 *       display: block;
 *     }
 *   }
 *
 *   &[open]::details-content {
 *     height: auto;
 *     opacity: 1;
 *   }
 *
 *   summary {
 *     cursor: pointer;
 *     user-select: none;
 *     // Remove default marker if desired
 *     // list-style: none;
 *     // &::-webkit-details-marker { display: none; }
 *   }
 * }
 */
