class OffCanvasMenu extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			preventScroll: true
		};

		this.setState({
			isOpen: false
		});

		this.isDialog = this.element.tagName.toLowerCase() === 'dialog';
		if (!this.isDialog) {
			console.warn("OffCanvasMenu: Component should be attached to a <dialog> element.");
		}

		this.menuId = this.element.id;
		this.triggers = this.menuId ? document.querySelectorAll(`[data-offcanvas-target="${this.menuId}"]`) : [];
	}

	mount() {
		if (!this.isDialog) return;

		// Attach events to external triggers (e.g. burger button)
		// Methods are automatically bound via _autoBindFunctions in BaseComponent
		this.triggers.forEach(trigger => {
			trigger.addEventListener('click', this.handleTriggerClick);

			// Accessibility: set aria-controls and initial aria-expanded state
			if (this.menuId) {
				trigger.setAttribute('aria-controls', this.menuId);
			}
			if (!trigger.hasAttribute('aria-expanded')) {
				trigger.setAttribute('aria-expanded', this.state.isOpen ? 'true' : 'false');
			}
		});

		// Attach backdrop click
		this.element.addEventListener('click', this.handleBackdropClick);

		// Listen for native close event
		this.element.addEventListener('close', this.handleNativeClose);
		this.element.addEventListener('cancel', this.handleNativeCancel);

		// Swup integration: Force close on page transition to avoid dangling offcanvas
		if (window.swup) {
			window.swup.hooks.on("animation:out:start", this.handleSwupOut);
		}

		// Initial state based on URL hash or DOM
		const hash = window.location.hash;
		let shouldBeOpen = this.element.hasAttribute('open');

		if (hash && this.menuId && hash === `#${this.menuId}`) {
			shouldBeOpen = true;
		}

		if (shouldBeOpen) {
			this.setState({ isOpen: true });
		}
	}

	unmount() {
		if (window.swup) {
			window.swup.hooks.off("animation:out:start", this.handleSwupOut);
		}

		this.triggers.forEach(trigger => {
			trigger.removeEventListener('click', this.handleTriggerClick);
		});

		this.element.removeEventListener('click', this.handleBackdropClick);
		this.element.removeEventListener('close', this.handleNativeClose);
		this.element.removeEventListener('cancel', this.handleNativeCancel);

		if (this.options.preventScroll && this.element.open) {
			document.body.style.overflow = '';
		}
	}

	handleTriggerClick(e) {
		e.preventDefault();
		this.setState({ isOpen: true });
	}

	handleCloseClick(e) {
		e.preventDefault();
		this.setState({ isOpen: false });
	}

	handleNativeClose() {
		if (this.state.isOpen) {
			this.setState({ isOpen: false });
		}
	}

	handleNativeCancel(e) {
		if (!CSS.supports('transition-behavior', 'allow-discrete')) {
			e.preventDefault();
			this.setState({ isOpen: false });
		}
	}

	handleBackdropClick(event) {
		// If clicking directly on the dialog background, close it
		if (event.target === this.element) {
			this.setState({ isOpen: false });
		}
	}

	handleSwupOut() {
		if (this.state.isOpen) {
			this.setState({ isOpen: false });
		}
	}

	stateChange(stateChanges) {
		if ('isOpen' in stateChanges) {
			const { isOpen } = stateChanges;

			// Accessibility: update aria-expanded on triggers
			this.triggers.forEach(trigger => {
				trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
			});

			if (isOpen) {
				if (!this.element.open) {
					this.element.showModal();
				}

				if (this.options.preventScroll) {
					document.body.style.overflow = 'hidden';

					// Lenis integration: Stop smooth scrolling
					if (window.lenis) {
						window.lenis.stop();
					}
				}

				// Write menu ID to URL
				if (this.menuId && window.location.hash !== `#${this.menuId}`) {
					history.pushState(null, '', `#${this.menuId}`);
				}
			} else {
				if (this.element.open) {
					if (CSS.supports('transition-behavior', 'allow-discrete')) {
						this.element.close();
					} else {
						this.element.setAttribute('data-is-closing', 'true');
						const handleTransitionEnd = () => {
							this.element.removeAttribute('data-is-closing');
							this.element.close();
							this.element.removeEventListener('transitionend', handleTransitionEnd);
							clearTimeout(timeout);
						};
						const timeout = setTimeout(handleTransitionEnd, 500);
						this.element.addEventListener('transitionend', handleTransitionEnd);
					}
				}

				if (this.options.preventScroll) {
					document.body.style.overflow = '';

					// Lenis integration: Resume smooth scrolling
					if (window.lenis) {
						window.lenis.start();
					}
				}

				// Remove menu ID from URL
				if (this.menuId && window.location.hash === `#${this.menuId}`) {
					const urlWithoutHash = window.location.pathname + window.location.search;
					history.pushState(null, '', urlWithoutHash || '#');
				}
			}
		}
	}
}

gia.register(OffCanvasMenu);

/**
 * Expected HTML Structure:
 *
 * <!-- Trigger inside Header, e.g., a burger button -->
 * <header>
 *   <button data-offcanvas-target="main-menu" aria-label="Open menu" aria-expanded="false" aria-controls="main-menu">☰</button>
 * </header>
 *
 * <!-- The OffCanvasMenu itself -->
 * <dialog data-component="OffCanvasMenu" id="main-menu">
 *   <div class="offcanvas-content">
 *     <button data-action="click->handleCloseClick" aria-label="Close menu">✕</button>
 *     <nav>
 *       <ul>
 *         <li><a href="/">Home</a></li>
 *         <li><a href="/about">About</a></li>
 *       </ul>
 *     </nav>
 *   </div>
 * </dialog>
 *
 * Suggested SCSS:
 *
 * dialog[data-component="OffCanvasMenu"] {
 *   position: fixed;
 *   top: 0;
 *   left: 0;
 *   width: 100%;
 *   max-width: 400px;
 *   height: 100vh;
 *   max-height: 100vh;
 *   margin: 0;
 *   border: none;
 *   padding: 0;
 *   background: white;
 *   box-shadow: 2px 0 10px rgba(0,0,0,0.1);
 *
 *   // Slide from left by default
 *   transform: translateX(-100%);
 *   transition: transform 0.4s ease, opacity 0.4s ease, overlay 0.4s allow-discrete, display 0.4s allow-discrete;
 *   opacity: 0;
 *
 *   &::backdrop {
 *     background-color: rgba(0,0,0,0.5);
 *     backdrop-filter: blur(4px);
 *     transition: opacity 0.4s ease, backdrop-filter 0.4s ease;
 *     opacity: 0;
 *   }
 *
 *   &[open] {
 *     transform: translateX(0);
 *     opacity: 1;
 *
 *     &::backdrop {
 *       opacity: 1;
 *     }
 *   }
 *
 *   @starting-style {
 *     &[open] {
 *       transform: translateX(-100%);
 *       opacity: 0;
 *
 *       &::backdrop {
 *         opacity: 0;
 *       }
 *     }
 *   }
 *
 *   &[data-is-closing="true"] {
 *     opacity: 0;
 *     transform: translateX(-100%);
 *
 *     &::backdrop {
 *       opacity: 0;
 *     }
 *   }
 *
 *   .offcanvas-content {
 *     padding: 2rem;
 *     height: 100%;
 *     overflow-y: auto;
 *   }
 * }
 */
