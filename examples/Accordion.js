class Accordion extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			closeOthers: false, // If true, only one accordion item can be open at a time within the same group
		};

		// Expected DOM structure using native HTML5:
		// <details data-component="Accordion">
		//    <summary>Toggle</summary>
		//    <div class="content">Content</div>
		// </details>

		this.isDetails = this.element.tagName.toLowerCase() === 'details';
		if (!this.isDetails) {
			console.warn("Accordion: Component should be attached to a <details> element.");
		}
	}

	mount() {
		if (!this.isDetails) return;

		this.element.addEventListener('toggle', this.handleToggle);

		// Event listener for closing others
		if (this.options.closeOthers) {
			window.addEventListener('accordion:open', this.handleAccordionOpen);
		}
	}

	unmount() {
		if (this.isDetails) {
			this.element.removeEventListener('toggle', this.handleToggle);
		}

		if (this.options.closeOthers) {
			window.removeEventListener('accordion:open', this.handleAccordionOpen);
		}
	}

	handleToggle(event) {
		if (this.element.open) {
			// Dispatch event for other accordions to close
			if (this.options.closeOthers) {
				const customEvent = new CustomEvent('accordion:open', {
					detail: { instance: this, parent: this.element.parentElement }
				});
				window.dispatchEvent(customEvent);
			}
		}
	}

	handleAccordionOpen(event) {
		const { instance, parent } = event.detail;

		// Close this accordion if it's not the one that just opened,
		// and it shares the same parent (grouped)
		if (instance !== this && parent === this.element.parentElement && this.element.open) {
			this.element.open = false;
		}
	}
}

gia.register(Accordion);
