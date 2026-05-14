class TextFit extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			minSize: 16,
			maxSize: 512,
			multiLine: true,
			...this.options
		};

		this.handleResize = this.handleResize.bind(this);
	}

	async require() {
		await this.loadScript('fitty-js', 'fitty');
	}

	mount() {
		if (typeof fitty === 'function') {
			this.fittyInstances = fitty(this.element, this.options);
			this.observeResize(this.element.parentElement, this.handleResize);
		} else {
			console.warn("TextFit: fitty is not defined. Make sure to include the fitty library.");
		}
	}

	handleResize() {
		if (this.fittyInstances) {
			const instances = Array.isArray(this.fittyInstances) ? this.fittyInstances : [this.fittyInstances];
			instances.forEach(instance => {
				if (instance && typeof instance.fit === 'function') {
					instance.fit();
				}
			});
		}
	}

	unmount() {
		this.unobserveResize(this.element.parentElement);

		// Clean up fitty instances if they exist and have an unsubscribe method
		if (this.fittyInstances) {
			const instances = Array.isArray(this.fittyInstances) ? this.fittyInstances : [this.fittyInstances];
			instances.forEach(instance => {
				if (instance && typeof instance.unsubscribe === 'function') {
					instance.unsubscribe();
				}
			});
		}
	}
}

gia.register(TextFit);

/**
 * Expected HTML Structure:
 *
 * <div data-component="TextFit" data-options='{"minSize": 10, "maxSize": 100}'>
 *   Text that will fit to its container perfectly!
 * </div>
 *
 * Ensure that fitty is loaded globally before using this component.
 */
