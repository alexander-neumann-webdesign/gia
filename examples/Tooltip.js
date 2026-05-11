class Tooltip extends gia.Component {
	constructor(element) {
		super(element);

		this.popoverElement = null;
		this.arrowElement = null;
		this.isOpen = false;
		this.cleanupAutoUpdate = null;
	}

	async require() {
		// Asynchronously load the Floating UI UMD script.
		// Expected to be added to the bottom of your HTML:
		// <script id="floating-ui-js" data-src="vendor/floating-ui.umd.js"></script>
		try {
			// For this example we assume floating-ui-dom exposes window.FloatingUIDOM
			await this.loadScript("floating-ui", "FloatingUIDOM");
		} catch (error) {
			console.error("Tooltip: Failed to load Floating UI.", error);
		}
	}

	mount() {
		this.text = this.element.getAttribute('data-tooltip');
		this.position = this.element.getAttribute('data-position') || 'top';

		if (!this.text) {
			console.warn('Tooltip: No data-tooltip attribute found on element.');
			return;
		}

		if (typeof window.FloatingUIDOM === "undefined") {
			console.error("Tooltip: FloatingUIDOM is not defined on window.");
			return;
		}

		// Destructure needed Floating UI methods
		const { computePosition, offset, flip, shift, autoUpdate, arrow } = window.FloatingUIDOM;
		this.computePosition = computePosition;
		this.offset = offset;
		this.flip = flip;
		this.shift = shift;
		this.autoUpdate = autoUpdate;
		this.arrow = arrow;

		// Create Popover
		this.popoverElement = document.createElement('div');
		this.popoverElement.popover = 'manual';
		this.popoverElement.className = 'gia-tooltip-popover';
		this.popoverElement.textContent = this.text;

		// Create Arrow
		this.arrowElement = document.createElement('div');
		this.arrowElement.className = 'gia-tooltip-arrow';
		this.popoverElement.appendChild(this.arrowElement);

		const tooltipId = `tooltip-${Math.random().toString(36).substr(2, 9)}`;
		this.popoverElement.id = tooltipId;

		// Accessibility: associate the trigger with the tooltip content
		this.element.setAttribute('aria-describedby', tooltipId);

		// Fallback styling for non-popover supported browsers
		if (!('popover' in HTMLElement.prototype)) {
			this.popoverElement.style.display = 'none';
			this.popoverElement.style.position = 'fixed';
		} else {
			// Essential for popovers working with absolute positioning libs
			this.popoverElement.style.position = 'absolute';
			this.popoverElement.style.margin = '0';
			this.popoverElement.style.top = '0';
			this.popoverElement.style.left = '0';
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

		if (this.cleanupAutoUpdate) {
			this.cleanupAutoUpdate();
			this.cleanupAutoUpdate = null;
		}

		if (this.popoverElement && this.popoverElement.parentNode) {
			this.popoverElement.parentNode.removeChild(this.popoverElement);
		}
	}

	handleShow() {
		if (!this.computePosition) return;

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

		// Initialize Floating UI autoUpdate
		this.cleanupAutoUpdate = this.autoUpdate(
			this.element,
			this.popoverElement,
			() => this.updatePosition()
		);

		// Add global listeners when open (for Escape key)
		window.addEventListener('keydown', this.handleEscape);
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

		if (this.cleanupAutoUpdate) {
			this.cleanupAutoUpdate();
			this.cleanupAutoUpdate = null;
		}

		this.removeGlobalListeners();
	}

	removeGlobalListeners() {
		window.removeEventListener('keydown', this.handleEscape);
	}

	handleEscape(e) {
		// WCAG 1.4.13: Dismissible via Escape key
		if (e.key === 'Escape' || e.key === 'Esc') {
			this.closeTooltip();
		}
	}

	updatePosition() {
		this.computePosition(this.element, this.popoverElement, {
			placement: this.position,
			middleware: [
				this.offset(8),
				this.flip(),
				this.shift({ padding: 8 }),
				this.arrow({ element: this.arrowElement })
			]
		}).then(({ x, y, placement, middlewareData }) => {
			Object.assign(this.popoverElement.style, {
				left: `${x}px`,
				top: `${y}px`,
			});

			// Accessing the data
			if (middlewareData.arrow) {
				const { x: arrowX, y: arrowY } = middlewareData.arrow;

				const staticSide = {
					top: 'bottom',
					right: 'left',
					bottom: 'top',
					left: 'right',
				}[placement.split('-')[0]];

				Object.assign(this.arrowElement.style, {
					left: arrowX != null ? `${arrowX}px` : '',
					top: arrowY != null ? `${arrowY}px` : '',
					right: '',
					bottom: '',
					[staticSide]: '-4px', // 4px is half the width/height of the 8px arrow
				});
			}
		});
	}
}

gia.register(Tooltip);

/**
 * Expected HTML Structure:
 *
 * <!-- Required External Script: -->
 * <!-- <script id="floating-ui-js" data-src="vendor/floating-ui.umd.js"></script> -->
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
 *
 *   .gia-tooltip-arrow {
 *     position: absolute;
 *     background-color: #333;
 *     width: 8px;
 *     height: 8px;
 *     transform: rotate(45deg);
 *   }
 * }
 */
