class TextFit extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			minSize: 16,
			maxSize: 512,
			multiLine: true,
			...this.options
		};
	}

	async require() {
		await this.loadScript('fitty-js', 'fitty');
	}

	mount() {
		if (typeof fitty === 'function') {
			this.fittyInstances = fitty(this.element, this.options);
		} else {
			console.warn("TextFit: fitty is not defined. Make sure to include the fitty library.");
		}
	}

	unmount() {
		// Clean up fitty instances if they exist and have an unsubscribe method
		if (this.fittyInstances) {
			const instances = Array.isArray(this.fittyInstances) ? this.fittyInstances : [this.fittyInstances];
			for (let i = 0; i < instances.length; i++) {
				if (instances[i] && typeof instances[i].unsubscribe === 'function') {
					instances[i].unsubscribe();
				}
			}
		}
	}
}

gia.register(TextFit);

/*
========================================
EXPECTED HTML
========================================

<div data-component="TextFit" data-options='{"minSize": 10, "maxSize": 100}'>
  Text that will fit to its container perfectly!
</div>

Ensure that fitty is loaded globally before using this component.
*/
