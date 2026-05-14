class MultipleSelect extends gia.Component {
	constructor(element) {
		super(element);
		this.ms = null;
		this.multipleSelectFn = null;
	}

	get value() {
		return this.ms ? this.ms.getSelects() : [];
	}

	set value(v) {
		if (this.ms) {
			this.ms.setSelects(Array.isArray(v) ? v : [v]);
		}
	}

	async require() {
		try {
			const { multipleSelect } = await import('multiple-select-vanilla');
			await import('multiple-select-vanilla/dist/styles/css/multiple-select.css');
			this.multipleSelectFn = multipleSelect;
		} catch (error) {
			console.error("MultipleSelect: Failed to load multiple-select-vanilla.", error);
		}
	}

	mount() {
		if (typeof this.multipleSelectFn !== 'function') {
			console.error("MultipleSelect: multipleSelect function is not available.");
			return;
		}

		this.ms = this.multipleSelectFn(this.element, this.options);
	}

	unmount() {
		if (this.ms) {
			this.ms.destroy();
			this.ms = null;
		}
	}
}

gia.register(MultipleSelect);
