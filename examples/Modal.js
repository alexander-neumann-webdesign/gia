class Modal extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			preventScroll: true,
		};

		this.ref = {
			closeButton: [], // Looks for [data-ref="closeButton"]
		};

		this.setState({
			isOpen: false,
		});

		this.isDialog = this.element instanceof HTMLDialogElement;
		if (!this.isDialog) {
			console.warn("Modal: Component should be attached to a <dialog> element.");
		}

		this.modalId = this.element.id;
		this.triggers = this.modalId ? document.querySelectorAll(`[data-modal-target="${this.modalId}"]`) : [];
	}

	mount() {
		if (!this.isDialog) return;

		// Attach events to triggers
		for (let i = 0; i < this.triggers.length; i++) {
			const trigger = this.triggers[i];
			trigger.addEventListener("click", this.handleTriggerClick);

			// Accessibility: set aria-controls and initial aria-expanded state
			if (this.modalId) {
				trigger.setAttribute("aria-controls", this.modalId);
			}
			if (!trigger.hasAttribute("aria-expanded")) {
				trigger.setAttribute("aria-expanded", this.state.isOpen ? "true" : "false");
			}
		}

		// Attach events to close buttons from refs
		const buttons = this.ref.closeButton;
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].addEventListener("click", this.handleCloseClick);
		}

		// Attach backdrop click
		this.element.addEventListener("click", this.handleBackdropClick);

		// Listen for native close event
		this.element.addEventListener("close", this.handleNativeClose);
		this.element.addEventListener("cancel", this.handleNativeCancel);

		// Swup integration: Force close on page transition to avoid dangling modals
		if (window.swup) {
			window.swup.hooks.on("animation:out:start", this.handleSwupOut);
		}

		// Initial state based on URL hash or DOM
		const hash = window.location.hash;
		let shouldBeOpen = this.element.hasAttribute("open");

		if (hash && this.modalId && hash === `#${this.modalId}`) {
			shouldBeOpen = true;
		}

		if (shouldBeOpen) {
			this.setState({ isOpen: true });
		}
	}

	unmount() {
		if (window.swup && this.handleSwupOut) {
			window.swup.hooks.off("animation:out:start", this.handleSwupOut);
		}

		for (let i = 0; i < this.triggers.length; i++) {
			this.triggers[i].removeEventListener("click", this.handleTriggerClick);
		}

		const buttons = this.ref.closeButton;
		for (let i = 0; i < buttons.length; i++) {
			buttons[i].removeEventListener("click", this.handleCloseClick);
		}

		this.element.removeEventListener("click", this.handleBackdropClick);
		this.element.removeEventListener("close", this.handleNativeClose);
		this.element.removeEventListener("cancel", this.handleNativeCancel);

		if (this.options.preventScroll && this.element.open) {
			document.body.style.overflow = "";
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
		if (!CSS.supports("transition-behavior", "allow-discrete")) {
			e.preventDefault();
			this.setState({ isOpen: false });
		}
	}

	handleBackdropClick(event) {
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
		if ("isOpen" in stateChanges) {
			const { isOpen } = stateChanges;

			gia.mutate(() => {
				// Accessibility: update aria-expanded on triggers
				for (let i = 0; i < this.triggers.length; i++) {
					this.triggers[i].setAttribute("aria-expanded", isOpen ? "true" : "false");
				}

				if (isOpen) {
					if (!this.element.open) {
						this.element.showModal();
					}

					if (this.options.preventScroll) {
						document.body.style.overflow = "hidden";

						// Lenis integration: Stop smooth scrolling
						if (window.lenis) {
							window.lenis.stop();
						}
					}

					// Write modal ID to URL
					if (this.modalId && window.location.hash !== `#${this.modalId}`) {
						history.pushState(null, "", `#${this.modalId}`);
					}
				} else {
					if (this.element.open) {
						if (CSS.supports("transition-behavior", "allow-discrete")) {
							this.element.close();
						} else {
							this.element.setAttribute("data-is-closing", "true");
							const handleTransitionEnd = () => {
								gia.mutate(() => {
									this.element.removeAttribute("data-is-closing");
									this.element.close();
								});
								this.element.removeEventListener("transitionend", handleTransitionEnd);
								clearTimeout(timeout);
							};
							const timeout = setTimeout(handleTransitionEnd, 500);
							this.element.addEventListener("transitionend", handleTransitionEnd);
						}
					}

					if (this.options.preventScroll) {
						document.body.style.overflow = "";

						// Lenis integration: Resume smooth scrolling
						if (window.lenis) {
							window.lenis.start();
						}
					}

					// Remove modal ID from URL
					if (this.modalId && window.location.hash === `#${this.modalId}`) {
						const urlWithoutHash = window.location.pathname + window.location.search;
						history.pushState(null, "", urlWithoutHash || "#");
					}
				}
			});
		}
	}
}

gia.register(Modal, { priority: -50 });

/*
========================================
EXPECTED HTML
========================================

<!-- Triggers can be anywhere -->
<button data-modal-target="my-modal" aria-controls="my-modal" aria-expanded="false">Open Modal</button>

<!-- The modal itself -->
<dialog data-component="Modal" id="my-modal">
  <div class="modal-content">
    <h2>Modal Title</h2>
    <button data-ref="closeButton">Close</button>
  </div>
</dialog>

========================================
SUGGESTED SCSS
========================================

dialog[data-component="Modal"] {
  // Center it via standard dialog rules, or custom
  margin: auto;
  inset: 0;
  border: none;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);

  &::backdrop {
    background-color: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);

    transition: opacity 0.4s ease, backdrop-filter 0.4s ease, overlay 0.4s allow-discrete, display 0.4s allow-discrete;
    opacity: 0;
  }

  // Modern discrete animation logic
  transition: opacity 0.4s ease, transform 0.4s ease, overlay 0.4s allow-discrete, display 0.4s allow-discrete;
  opacity: 0;
  transform: translateY(10px);

  &[open] {
    opacity: 1;
    transform: translateY(0);

    &::backdrop {
      opacity: 1;
    }
  }

  @starting-style {
    &[open] {
      opacity: 0;
      transform: translateY(10px);

      &::backdrop {
        opacity: 0;
      }
    }
  }

  &[data-is-closing="true"] {
    opacity: 0;
    transform: translateY(10px);

    &::backdrop {
      opacity: 0;
    }
  }
}
*/
