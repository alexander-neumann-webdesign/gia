import Component from "../src/Component.js";

export default class Accordion extends Component {
	constructor(element) {
		super(element);

		this.options = {
			closeOthers: false, // If true, only one accordion item can be open at a time within the same group
		};

		// Expected DOM structure:
		// <div data-component="Accordion">
		//    <button data-ref="trigger" aria-expanded="false" aria-controls="content-id">Toggle</button>
		//    <div data-ref="content" id="content-id" hidden>Content</div>
		// </div>
		//
		// For groups with 'closeOthers': true, they should share a common parent

		this.trigger = this.element.querySelector('[data-ref="trigger"]');
		this.content = this.element.querySelector('[data-ref="content"]');

		this.isOpen = false;

		this.toggle = this.toggle.bind(this);
		this.handleKeydown = this.handleKeydown.bind(this);
	}

	mount() {
		if (!this.trigger || !this.content) {
			console.warn("Accordion: Missing trigger or content ref.");
			return;
		}

		// Initial state based on DOM
		this.isOpen = this.trigger.getAttribute('aria-expanded') === 'true';

		if (!this.isOpen) {
			this.content.hidden = true;
			this.content.style.height = '0px';
		} else {
			this.content.hidden = false;
			this.content.style.height = 'auto';
		}

		this.trigger.addEventListener('click', this.toggle);
		this.trigger.addEventListener('keydown', this.handleKeydown);

		// Event listener for closing others
		if (this.options.closeOthers) {
			window.addEventListener('accordion:open', this.handleAccordionOpen.bind(this));
		}
	}

	unmount() {
		if (this.trigger) {
			this.trigger.removeEventListener('click', this.toggle);
			this.trigger.removeEventListener('keydown', this.handleKeydown);
		}

		if (this.options.closeOthers) {
			window.removeEventListener('accordion:open', this.handleAccordionOpen.bind(this));
		}
	}

	toggle(event) {
		if (event) {
			event.preventDefault();
		}

		if (this.isOpen) {
			this.close();
		} else {
			this.open();
		}
	}

	open() {
		if (this.isOpen) return;

		this.isOpen = true;
		this.trigger.setAttribute('aria-expanded', 'true');

		this.content.hidden = false;

		// Animate height
		const scrollHeight = this.content.scrollHeight;
		this.content.style.height = `${scrollHeight}px`;

		// Dispatch event for other accordions to close
		if (this.options.closeOthers) {
			const event = new CustomEvent('accordion:open', {
				detail: { instance: this, parent: this.element.parentElement }
			});
			window.dispatchEvent(event);
		}

		// Reset height to auto after transition so it can adapt to content changes
		this.content.addEventListener('transitionend', () => {
			if (this.isOpen) {
				this.content.style.height = 'auto';
			}
		}, { once: true });
	}

	close() {
		if (!this.isOpen) return;

		this.isOpen = false;
		this.trigger.setAttribute('aria-expanded', 'false');

		// Get current height and set it explicitly before transitioning to 0
		const scrollHeight = this.content.scrollHeight;
		this.content.style.height = `${scrollHeight}px`;

		// Force reflow
		// eslint-disable-next-line no-unused-expressions
		this.content.offsetHeight;

		this.content.style.height = '0px';

		this.content.addEventListener('transitionend', () => {
			if (!this.isOpen) {
				this.content.hidden = true;
			}
		}, { once: true });
	}

	handleAccordionOpen(event) {
		const { instance, parent } = event.detail;

		// Close this accordion if it's not the one that just opened,
		// and it shares the same parent (grouped)
		if (instance !== this && parent === this.element.parentElement) {
			this.close();
		}
	}

	handleKeydown(event) {
		// Optional: Add keyboard navigation (Up/Down arrows) if part of a group
		// For simplicity, we just handle Space/Enter which are natively handled by <button>
		// If custom elements are used for triggers, we might need manual handling here.
	}
}
