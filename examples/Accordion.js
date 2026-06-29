class Accordion extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			closeOthers: false, // If true, only one accordion item can be open at a time within the same group
			icon: 'plus', // 'plus', 'arrow', or 'none'
			animationDuration: 500, // Matches the CSS transition duration for WAAPI fallback
		};

		this.ref = {
			summary: null, // Optional: if you specifically want to reference the summary
			title: null, // For WAAPI fallback: the <summary> element
			contentWrapper: null, // For WAAPI fallback: the content wrapper inside <details>
		};

		this.isDetails = this.element instanceof HTMLDetailsElement;
		if (!this.isDetails) {
			console.warn("Accordion: Component should be attached to a <details> element.");
		}

		// Feature detect native modern CSS support
		this.supportsNativeAnimation = CSS.supports('interpolate-size', 'allow-keywords');
		this.animation = null;

		// Initial state
		this.setState({
			isOpen: this.element.hasAttribute('open'),
			isClosing: false,
			isExpanding: false,
		});

		this.handleToggle = this.handleToggle.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleAccordionOpen = this.handleAccordionOpen.bind(this);
		this.maybeStartOpened = this.maybeStartOpened.bind(this);
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

		// If no native support, intercept clicks to use WAAPI
		if (!this.supportsNativeAnimation) {
			const titleEl = this.ref.title || summary;
			if (titleEl) {
				titleEl.addEventListener("click", this.handleClick);
			}
		}

		if (this.options.closeOthers) {
			window.addEventListener('accordion:open', this.handleAccordionOpen);
		}

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
				if (this.supportsNativeAnimation) {
					this.setState({ isOpen: true });
				} else {
					this.expand();
				}

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

		if (!this.supportsNativeAnimation) {
			const titleEl = this.ref.title || this.element.querySelector('summary');
			if (titleEl) {
				titleEl.removeEventListener("click", this.handleClick);
			}
		}

		if (this.options.closeOthers) {
			window.removeEventListener('accordion:open', this.handleAccordionOpen);
		}
	}

	handleToggle(event) {
		// Only update state if it doesn't match the element's actual state
		if (this.state.isOpen !== this.element.open) {
			this.setState({ isOpen: this.element.open });

			if (window.ScrollTrigger) {
				setTimeout(() => {
					window.ScrollTrigger.refresh();
				}, 500);
			}
		}
	}

	handleClick(event) {
		event.preventDefault();
		this.element.style.overflow = "hidden";

		if (this.state.isClosing || !this.element.open) {
			this.expand();
		} else if (this.state.isExpanding || this.element.open) {
			this.shrink();
		}
	}

	shrink() {
		this.setState({ isClosing: true });
		
		const titleEl = this.ref.title || this.element.querySelector('summary');
		const startHeight = `${this.element.offsetHeight}px`;
		const endHeight = `${titleEl.offsetHeight}px`;
		
		if (this.animation) {
			this.animation.cancel();
		}
		
		this.animation = this.element.animate(
			{ height: [startHeight, endHeight] },
			{ duration: this.options.animationDuration, easing: "ease" }
		);
		
		this.animation.onfinish = () => this.onAnimationFinish(false);
		this.animation.oncancel = () => this.setState({ isClosing: false });
	}

	expand() {
		this.element.style.height = `${this.element.offsetHeight}px`;
		this.element.open = true;
		
		window.requestAnimationFrame(() => {
			this.setState({ isExpanding: true });
			
			const titleEl = this.ref.title || this.element.querySelector('summary');
			const contentEl = this.ref.contentWrapper || this.element.querySelector('.content');
			
			const startHeight = `${this.element.offsetHeight}px`;
			const endHeight = `${titleEl.offsetHeight + (contentEl ? contentEl.offsetHeight : 0)}px`;
			
			if (this.animation) {
				this.animation.cancel();
			}
			
			this.animation = this.element.animate(
				{ height: [startHeight, endHeight] },
				{ duration: this.options.animationDuration, easing: "ease" }
			);
			
			this.animation.onfinish = () => this.onAnimationFinish(true);
			this.animation.oncancel = () => this.setState({ isExpanding: false });
		});
	}

	onAnimationFinish(open) {
		this.element.open = open;
		this.animation = null;
		this.setState({
			isClosing: false,
			isExpanding: false,
			isOpen: open
		});
		this.element.style.height = this.element.style.overflow = "";

		if (window.ScrollTrigger) {
			window.ScrollTrigger.refresh();
		}
	}

	handleAccordionOpen(event) {
		const { instance, parent } = event.detail;

		if (instance !== this && parent === this.element.parentElement && this.state.isOpen) {
			if (this.supportsNativeAnimation) {
				this.setState({ isOpen: false });
			} else {
				this.shrink();
			}
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

			setTimeout(() => {
				window.dispatchEvent(new Event('resize'));
			}, 0);
		}

		if ('isClosing' in stateChanges) {
			this.element.classList.toggle("is-closing", this.state.isClosing);
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
