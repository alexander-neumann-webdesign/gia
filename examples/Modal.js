class Modal extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			preventScroll: true
		};

		// The component should be attached to a <dialog> element.
		this.isDialog = this.element.tagName.toLowerCase() === 'dialog';
		if (!this.isDialog) {
			console.warn("Modal: Component should be attached to a <dialog> element.");
		}

		this.closeButtons = this.element.querySelectorAll('[data-ref="closeButton"]');

		// Find triggers outside the component using a data attribute matching this modal's ID
		this.modalId = this.element.id;
		this.triggers = this.modalId ? document.querySelectorAll(`[data-modal-target="${this.modalId}"]`) : [];
	}

	mount() {
		if (!this.isDialog) return;

		// Attach events to triggers
		this.triggers.forEach(trigger => {
			trigger.addEventListener('click', this.handleTriggerClick);
		});

		// Attach events to close buttons
		this.closeButtons.forEach(btn => {
			btn.addEventListener('click', this.handleCloseClick);
		});

		// Attach backdrop click (clicking outside the dialog content)
		this.element.addEventListener('click', this.handleBackdropClick);

		// Listen for native close event (e.g., from Escape key)
		this.element.addEventListener('close', this.handleNativeClose);

		// Initial state
		if (this.element.hasAttribute('open')) {
			this.onOpen();
		}
	}

	unmount() {
		this.triggers.forEach(trigger => {
			trigger.removeEventListener('click', this.handleTriggerClick);
		});

		this.closeButtons.forEach(btn => {
			btn.removeEventListener('click', this.handleCloseClick);
		});

		this.element.removeEventListener('click', this.handleBackdropClick);
		this.element.removeEventListener('close', this.handleNativeClose);

		if (this.options.preventScroll && this.element.open) {
			document.body.style.overflow = '';
		}
	}

	handleTriggerClick(e) {
		e.preventDefault();
		this.open();
	}

	handleCloseClick(e) {
		e.preventDefault();
		this.close();
	}

	open() {
		if (this.element.open) return;

		// Using showModal for a true modal with a backdrop and focus trapping
		this.element.showModal();
		this.onOpen();
	}

	close() {
		if (!this.element.open) return;

		this.element.close();
		// The 'close' event will trigger handleNativeClose which calls onClose
	}

	onOpen() {
		if (this.options.preventScroll) {
			document.body.style.overflow = 'hidden';
		}
	}

	onClose() {
		if (this.options.preventScroll) {
			document.body.style.overflow = '';
		}
	}

	handleNativeClose() {
		this.onClose();
	}

	handleBackdropClick(event) {
		// In a native <dialog>, clicking on the ::backdrop targets the dialog element itself.
		// Clicking on content inside the dialog targets those elements.
		if (event.target === this.element) {
			this.close();
		}
	}
}

gia.register(Modal);
