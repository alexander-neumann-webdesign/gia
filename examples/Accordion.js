class Accordion extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			closeOthers: false, // If true, only one accordion item can be open at a time within the same group
		};

		this.ref = {
			summary: null // Optional: if you specifically want to reference the summary
		};

		this.isDetails = this.element.tagName.toLowerCase() === 'details';
		if (!this.isDetails) {
			console.warn("Accordion: Component should be attached to a <details> element.");
		}

		this.setState({
			isOpen: false
		});
	}

	mount() {
		if (!this.isDetails) return;

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
 *     ::details-content {
 *       transition: height 0.5s ease, content-visibility 0.5s ease allow-discrete;
 *       height: 0;
 *       overflow: clip;
 *     }
 *   }
 *
 *   &[open]::details-content {
 *     height: auto;
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
