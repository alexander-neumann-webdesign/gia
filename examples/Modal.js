import Component from "../src/Component.js";

export default class Modal extends Component {
	constructor(element) {
		super(element);

		this.options = {
			openClass: 'is-open',
			preventScroll: true
		};

		// The component can be attached to the modal itself, or a wrapper.
		// If attached to a trigger, we might need a different approach.
		// Assuming element is the modal wrapper.
		this.dialog = this.element.querySelector('[role="dialog"]') || this.element;
		this.closeButtons = this.element.querySelectorAll('[data-ref="closeButton"]');

		// Find triggers outside the component using a data attribute matching this modal's ID
		this.modalId = this.element.id;
		this.triggers = this.modalId ? document.querySelectorAll(`[data-modal-target="${this.modalId}"]`) : [];

		this.isOpen = false;

		this.open = this.open.bind(this);
		this.close = this.close.bind(this);
		this.handleKeydown = this.handleKeydown.bind(this);
		this.handleBackdropClick = this.handleBackdropClick.bind(this);

		// Focus management
		this.focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
		this.focusableElements = [];
		this.firstFocusableElement = null;
		this.lastFocusableElement = null;
		this.previouslyFocusedElement = null;
	}

	mount() {
		// Attach events to triggers
		this.triggers.forEach(trigger => {
			trigger.addEventListener('click', (e) => {
				e.preventDefault();
				this.open();
			});
		});

		// Attach events to close buttons
		this.closeButtons.forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				this.close();
			});
		});

		// Attach backdrop click
		this.element.addEventListener('mousedown', this.handleBackdropClick);

		// Initial state
		if (this.element.classList.contains(this.options.openClass) || this.element.hasAttribute('open')) {
			this.open();
		} else {
			this.element.hidden = true;
		}
	}

	unmount() {
		this.triggers.forEach(trigger => {
			// Note: inline arrow functions in mount are hard to remove without storing references.
			// For a fully robust component, we'd store bound handlers.
		});

		this.closeButtons.forEach(btn => {
			// Same as above
		});

		this.element.removeEventListener('mousedown', this.handleBackdropClick);
		if (this.isOpen) {
			document.removeEventListener('keydown', this.handleKeydown);
			if (this.options.preventScroll) {
				document.body.style.overflow = '';
			}
		}
	}

	open() {
		if (this.isOpen) return;

		this.isOpen = true;
		this.previouslyFocusedElement = document.activeElement;

		this.element.hidden = false;
		// Small delay to allow display:block to apply before adding class for opacity transition
		requestAnimationFrame(() => {
			this.element.classList.add(this.options.openClass);
			this.dialog.setAttribute('aria-modal', 'true');

			if (this.options.preventScroll) {
				document.body.style.overflow = 'hidden';
			}

			this.setupFocus();
			document.addEventListener('keydown', this.handleKeydown);
		});
	}

	close() {
		if (!this.isOpen) return;

		this.isOpen = false;
		this.element.classList.remove(this.options.openClass);
		this.dialog.removeAttribute('aria-modal');

		if (this.options.preventScroll) {
			document.body.style.overflow = '';
		}

		document.removeEventListener('keydown', this.handleKeydown);

		// Wait for transition before hiding
		const onTransitionEnd = (e) => {
			if (e.target === this.element || e.target === this.dialog) {
				this.element.hidden = true;
				this.element.removeEventListener('transitionend', onTransitionEnd);
			}
		};

		this.element.addEventListener('transitionend', onTransitionEnd);

		// Fallback if no transition
		setTimeout(() => {
			if (!this.isOpen && !this.element.hidden) {
				this.element.hidden = true;
				this.element.removeEventListener('transitionend', onTransitionEnd);
			}
		}, 500); // Max transition time fallback

		// Restore focus
		if (this.previouslyFocusedElement) {
			this.previouslyFocusedElement.focus();
		}
	}

	setupFocus() {
		this.focusableElements = Array.from(this.dialog.querySelectorAll(this.focusableElementsString));

		if (this.focusableElements.length > 0) {
			this.firstFocusableElement = this.focusableElements[0];
			this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
			this.firstFocusableElement.focus();
		} else {
			// If no focusable elements, focus the dialog itself (should have tabindex="-1")
			this.dialog.setAttribute('tabindex', '-1');
			this.dialog.focus();
		}
	}

	handleKeydown(event) {
		if (event.key === 'Escape' || event.keyCode === 27) {
			this.close();
		}

		// Trap focus
		if (event.key === 'Tab' || event.keyCode === 9) {
			if (this.focusableElements.length === 0) {
				event.preventDefault();
				return;
			}

			if (event.shiftKey) { // Shift + Tab
				if (document.activeElement === this.firstFocusableElement) {
					event.preventDefault();
					this.lastFocusableElement.focus();
				}
			} else { // Tab
				if (document.activeElement === this.lastFocusableElement) {
					event.preventDefault();
					this.firstFocusableElement.focus();
				}
			}
		}
	}

	handleBackdropClick(event) {
		// Close if clicked outside the dialog (on the backdrop)
		// Assuming element is the backdrop and dialog is the inner container
		if (event.target === this.element && event.target !== this.dialog) {
			this.close();
		}
	}
}
