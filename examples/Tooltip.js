class Tooltip extends gia.Component {
	constructor(element) {
		super(element);

		this.popoverElement = null;
		this.isOpen = false;

		// Bind methods
		this.handleShow = this.handleShow.bind(this);
		this.handleHide = this.handleHide.bind(this);
		this.handleEscape = this.handleEscape.bind(this);
		this.updatePosition = this.updatePosition.bind(this);
		this.handleScroll = this.handleScroll.bind(this);
		this.handleTooltipEnter = this.handleTooltipEnter.bind(this);
		this.handleTooltipLeave = this.handleTooltipLeave.bind(this);
	}

	mount() {
		this.text = this.element.getAttribute('data-tooltip');
		this.position = this.element.getAttribute('data-position') || 'top';

		if (!this.text) {
			console.warn('Tooltip: No data-tooltip attribute found on element.');
			return;
		}

		this.popoverElement = document.createElement('div');
		this.popoverElement.popover = 'manual';
		this.popoverElement.className = 'gia-tooltip-popover';
		this.popoverElement.textContent = this.text;

		const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
		this.popoverElement.id = tooltipId;

		// Accessibility: associate the trigger with the tooltip content
		this.element.setAttribute('aria-describedby', tooltipId);

		// Fallback styling for non-popover supported browsers
		if (!('popover' in HTMLElement.prototype)) {
			this.popoverElement.style.display = 'none';
			this.popoverElement.style.position = 'fixed';
		}

		document.body.appendChild(this.popoverElement);

		// Trigger events
		this.element.addEventListener('mouseenter', this.handleShow);
		this.element.addEventListener('focus', this.handleShow);

		this.element.addEventListener('mouseleave', this.handleHide);
		this.element.addEventListener('blur', this.handleHide);

		// WCAG 1.4.13: Hoverable (keep open when moving over the tooltip itself)
		this.popoverElement.addEventListener('mouseenter', this.handleTooltipEnter);
		this.popoverElement.addEventListener('mouseleave', this.handleTooltipLeave);
	}

	unmount() {
		this.element.removeEventListener('mouseenter', this.handleShow);
		this.element.removeEventListener('focus', this.handleShow);
		this.element.removeEventListener('mouseleave', this.handleHide);
		this.element.removeEventListener('blur', this.handleHide);

		if (this.popoverElement) {
			this.popoverElement.removeEventListener('mouseenter', this.handleTooltipEnter);
			this.popoverElement.removeEventListener('mouseleave', this.handleTooltipLeave);
		}

		this.removeGlobalListeners();

		if (this.popoverElement && this.popoverElement.parentNode) {
			this.popoverElement.parentNode.removeChild(this.popoverElement);
		}
	}

	handleShow() {
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}

		if (this.isOpen) return;
		this.isOpen = true;

		if (typeof this.popoverElement.showPopover === 'function') {
			this.popoverElement.showPopover();
		} else {
			this.popoverElement.style.display = 'block';
		}

		this.updatePosition();

		// Add global listeners when open
		window.addEventListener('keydown', this.handleEscape);
		window.addEventListener('scroll', this.handleScroll, { passive: true });
		window.addEventListener('resize', this.updatePosition, { passive: true });
	}

	handleHide() {
		// Add a tiny delay to allow moving mouse from trigger to tooltip
		this.hideTimeout = setTimeout(() => {
			this.closeTooltip();
		}, 100);
	}

	handleTooltipEnter() {
		if (this.hideTimeout) {
			clearTimeout(this.hideTimeout);
			this.hideTimeout = null;
		}
	}

	handleTooltipLeave() {
		this.handleHide();
	}

	closeTooltip() {
		if (!this.isOpen) return;
		this.isOpen = false;

		if (typeof this.popoverElement.hidePopover === 'function') {
			this.popoverElement.hidePopover();
		} else {
			this.popoverElement.style.display = 'none';
		}

		this.removeGlobalListeners();
	}

	removeGlobalListeners() {
		window.removeEventListener('keydown', this.handleEscape);
		window.removeEventListener('scroll', this.handleScroll);
		window.removeEventListener('resize', this.updatePosition);
	}

	handleEscape(e) {
		// WCAG 1.4.13: Dismissible via Escape key
		if (e.key === 'Escape' || e.key === 'Esc') {
			this.closeTooltip();
		}
	}

	handleScroll() {
		// Update position if it's open and user scrolls
		if (this.isOpen) {
			requestAnimationFrame(() => {
				this.updatePosition();
			});
		}
	}

	updatePosition() {
		if (!this.isOpen) return;

		const triggerRect = this.element.getBoundingClientRect();
		const popoverRect = this.popoverElement.getBoundingClientRect();

		let placement = this.position;
		const spacing = 8; // Offset from the trigger

		const calculateCoords = (pos) => {
			let t, l;
			switch (pos) {
				case 'top':
					t = triggerRect.top - popoverRect.height - spacing;
					l = triggerRect.left + (triggerRect.width / 2) - (popoverRect.width / 2);
					break;
				case 'bottom':
					t = triggerRect.bottom + spacing;
					l = triggerRect.left + (triggerRect.width / 2) - (popoverRect.width / 2);
					break;
				case 'left':
					t = triggerRect.top + (triggerRect.height / 2) - (popoverRect.height / 2);
					l = triggerRect.left - popoverRect.width - spacing;
					break;
				case 'right':
					t = triggerRect.top + (triggerRect.height / 2) - (popoverRect.height / 2);
					l = triggerRect.right + spacing;
					break;
			}
			return { t, l };
		};

		let { t, l } = calculateCoords(placement);

		// Boundaries logic to prevent tooltip from going off-screen
		const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
		const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

		let outOfBounds = false;

		if (placement === 'top' && t < 0) {
			placement = 'bottom';
			outOfBounds = true;
		} else if (placement === 'bottom' && (t + popoverRect.height) > viewportHeight) {
			placement = 'top';
			outOfBounds = true;
		} else if (placement === 'left' && l < 0) {
			placement = 'right';
			outOfBounds = true;
		} else if (placement === 'right' && (l + popoverRect.width) > viewportWidth) {
			placement = 'left';
			outOfBounds = true;
		}

		if (outOfBounds) {
			const newCoords = calculateCoords(placement);
			t = newCoords.t;
			l = newCoords.l;
		}

		// Final clamping to keep the tooltip visible horizontally/vertically if it still overflows
		if (l < spacing) l = spacing;
		if (l + popoverRect.width > viewportWidth - spacing) l = viewportWidth - popoverRect.width - spacing;
		if (t < spacing) t = spacing;
		if (t + popoverRect.height > viewportHeight - spacing) t = viewportHeight - popoverRect.height - spacing;

		// Since popovers are rendered in the top layer, position: fixed is used implicitly
		this.popoverElement.style.top = `${t}px`;
		this.popoverElement.style.left = `${l}px`;
	}
}

gia.register(Tooltip);

/**
 * Expected HTML Structure:
 *
 * <button data-component="Tooltip" data-tooltip="This is a helpful tip" data-position="top">
 *   Hover or Focus Me
 * </button>
 *
 * Suggested SCSS:
 *
 * .gia-tooltip-popover {
 *   background-color: #333;
 *   color: #fff;
 *   padding: 0.5rem 0.75rem;
 *   border-radius: 4px;
 *   font-size: 0.875rem;
 *   white-space: nowrap;
 *   z-index: 1000;
 *
 *   // Modern popovers reset
 *   margin: 0;
 *   inset: auto;
 *   border: none;
 *
 *   &::backdrop {
 *     display: none;
 *   }
 * }
 */
