class Modal extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			preventScroll: true
		};

		this.ref = {
			closeButton: [] // Looks for [data-ref="closeButton"]
		};

		this.setState({
			isOpen: false
		});

		this.isDialog = this.element.tagName.toLowerCase() === 'dialog';
		if (!this.isDialog) {
			console.warn("Modal: Component should be attached to a <dialog> element.");
		}

		this.modalId = this.element.id;
		this.triggers = this.modalId ? document.querySelectorAll(`[data-modal-target="${this.modalId}"]`) : [];
	}

	mount() {
		if (!this.isDialog) return;

		// Attach events to triggers
		this.triggers.forEach(trigger => {
			trigger.addEventListener('click', this.handleTriggerClick);
		});

		// Attach events to close buttons from refs
		if (this.ref.closeButton) {
			const buttons = Array.isArray(this.ref.closeButton) ? this.ref.closeButton : [this.ref.closeButton];
			buttons.forEach(btn => {
				btn.addEventListener('click', this.handleCloseClick);
			});
		}

		// Attach backdrop click
		this.element.addEventListener('click', this.handleBackdropClick);

		// Listen for native close event
		this.element.addEventListener('close', this.handleNativeClose);

		// Initial state based on URL hash or DOM
		const hash = window.location.hash;
		let shouldBeOpen = this.element.hasAttribute('open');

		if (hash && this.modalId && hash === `#${this.modalId}`) {
			shouldBeOpen = true;
		}

		if (shouldBeOpen) {
			this.setState({ isOpen: true });
		}
	}

	unmount() {
		this.triggers.forEach(trigger => {
			trigger.removeEventListener('click', this.handleTriggerClick);
		});

		if (this.ref.closeButton) {
			const buttons = Array.isArray(this.ref.closeButton) ? this.ref.closeButton : [this.ref.closeButton];
			buttons.forEach(btn => {
				btn.removeEventListener('click', this.handleCloseClick);
			});
		}

		this.element.removeEventListener('click', this.handleBackdropClick);
		this.element.removeEventListener('close', this.handleNativeClose);

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

	handleBackdropClick(event) {
		if (event.target === this.element) {
			this.setState({ isOpen: false });
		}
	}

	stateChange(stateChanges) {
		if ('isOpen' in stateChanges) {
			const { isOpen } = stateChanges;

			if (isOpen) {
				if (!this.element.open) {
					this.element.showModal();
				}

				if (this.options.preventScroll) {
					document.body.style.overflow = 'hidden';
				}

				// Write modal ID to URL
				if (this.modalId && window.location.hash !== `#${this.modalId}`) {
					history.pushState(null, '', `#${this.modalId}`);
				}
			} else {
				if (this.element.open) {
					this.element.close();
				}

				if (this.options.preventScroll) {
					document.body.style.overflow = '';
				}

				// Remove modal ID from URL
				if (this.modalId && window.location.hash === `#${this.modalId}`) {
					const urlWithoutHash = window.location.pathname + window.location.search;
					history.pushState(null, '', urlWithoutHash || '#');
				}
			}
		}
	}
}

gia.register(Modal);
