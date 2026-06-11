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

		this.isDetails = this.element instanceof HTMLDetailsElement;
		if (!this.isDetails) {
			console.warn("Accordion: Component should be attached to a <details> element.");
		}

		// Initial state is correctly set from element initially or open attribute
		this.setState({
			isOpen: this.element.hasAttribute('open')
		});
	}

	getIconSvg(iconType) {
		const svgNS = "http://www.w3.org/2000/svg";
		const svg = document.createElementNS(svgNS, "svg");
		svg.setAttribute("width", "24");
		svg.setAttribute("height", "24");
		svg.setAttribute("viewBox", "0 0 24 24");
		svg.setAttribute("fill", "none");
		svg.setAttribute("stroke", "currentColor");
		svg.setAttribute("stroke-width", "2");
		svg.setAttribute("stroke-linecap", "round");
		svg.setAttribute("stroke-linejoin", "round");
		svg.setAttribute("aria-hidden", "true");

		if (iconType === 'plus') {
			svg.setAttribute("class", "accordion-icon accordion-icon--plus");

			const line1 = document.createElementNS(svgNS, "line");
			line1.setAttribute("x1", "12");
			line1.setAttribute("y1", "5");
			line1.setAttribute("x2", "12");
			line1.setAttribute("y2", "19");
			line1.setAttribute("class", "vertical-line");

			const line2 = document.createElementNS(svgNS, "line");
			line2.setAttribute("x1", "5");
			line2.setAttribute("y1", "12");
			line2.setAttribute("x2", "19");
			line2.setAttribute("y2", "12");
			line2.setAttribute("class", "horizontal-line");

			svg.appendChild(line1);
			svg.appendChild(line2);
			return svg;
		} else if (iconType === 'arrow') {
			svg.setAttribute("class", "accordion-icon accordion-icon--arrow");

			const polyline = document.createElementNS(svgNS, "polyline");
			polyline.setAttribute("points", "6 9 12 15 18 9");

			svg.appendChild(polyline);
			return svg;
		}
		return null;
	}

	mount() {
		if (!this.isDetails) return;

		// Inject icon into summary if not present and icon !== 'none'
		const summary = this.element.querySelector('summary');
		if (summary && this.options.icon !== 'none') {
			if (!summary.querySelector('.accordion-icon')) {
				const iconSvg = this.getIconSvg(this.options.icon);
				if (iconSvg) {
					summary.appendChild(iconSvg);
				}
			}
		}

		this.element.addEventListener('toggle', this.handleToggle);

		if (this.options.closeOthers) {
			window.addEventListener('accordion:open', this.handleAccordionOpen);
		}

		this.maybeStartOpened = this.maybeStartOpened.bind(this);

		// Initial state based on URL hash or DOM
		let shouldBeOpen = this.element.open;
		const hash = window.location.hash;

		if (hash && this.element.id && hash === `#${this.element.id}`) {
			shouldBeOpen = true;

			// Optional: Scroll to the element if requested by hash
			setTimeout(() => {
				this.element.scrollIntoView({ behavior: 'smooth' });
			}, 100);
		}

		if (this.element.id && window.swup) {
			window.swup.hooks.on("scroll:end", this.maybeStartOpened);
		}

		this.setState({ isOpen: shouldBeOpen });
	}

	maybeStartOpened() {
		if (window.location.hash && this.element.id === window.location.hash.substring(1)) {
			if (!this.state.isOpen) {
				this.setState({ isOpen: true });

				setTimeout(() => {
					this.element.scrollIntoView({ behavior: 'smooth' });
				}, 100);
			}
		}
	}

	unmount() {
		if (this.element.id && window.swup) {
			window.swup.hooks.off("scroll:end", this.maybeStartOpened);
		}

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

			// Refresh ScrollTrigger after the transition is expected to complete
			// A 500ms timeout roughly matches the suggested CSS transition duration
			if (window.ScrollTrigger) {
				setTimeout(() => {
					window.ScrollTrigger.refresh();
				}, 500);
			}
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

			// Dispatch a window resize event to trigger layout updates
			// (e.g., for embla-carousel or other scripts that rely on window resizing)
			// ⚡ BOLT OPTIMIZATION: Defer resize event dispatch out of the stateChange (rAF) cycle
			// Dispatching synchronously inside rAF causes layout thrashing if listeners perform layout reads.
			setTimeout(() => {
				window.dispatchEvent(new Event('resize'));
			}, 0);
		}
		this.element.removeAttribute('data-is-open');
	}
}

gia.register(Accordion);


/**
 * Expected HTML Structure:
 *
 * <div itemscope="" itemtype="https://schema.org/FAQPage">
 *   <details data-component="Accordion" id="faq-1" itemscope="" itemprop="mainEntity" itemtype="https://schema.org/Question">
 *     <summary data-ref="title">
 *       <p itemprop="name">Lorem ipsum dolor sit amet?</p>
 *     </summary>
 *     <div class="content" data-ref="contentWrapper" itemscope="" itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
 *       <div itemprop="text">
 *         <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
 *       </div>
 *     </div>
 *   </details>
 * </div>
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
