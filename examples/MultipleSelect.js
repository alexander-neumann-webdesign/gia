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
			await Promise.all([
				this.loadStyle('multiple-select-css'),
				this.loadScript('multiple-select-js', 'multipleSelect')
			]);
		} catch (error) {
			console.error("MultipleSelect: Failed to load multiple-select-vanilla.", error);
		}
	}

	mount() {
		if (typeof window.multipleSelect === 'undefined') {
			console.error("MultipleSelect: multipleSelect is not defined on window.");
			return;
		}

		this.ms = window.multipleSelect(this.element, this.options);
	}

	unmount() {
		if (this.ms) {
			this.ms.destroy();
			this.ms = null;
		}
	}
}

gia.register(MultipleSelect);

/*
========================================
EXPECTED HTML
========================================

<!-- Add the vendor script/styles at the bottom of the body: -->
<!-- <link rel="stylesheet" id="multiple-select-css" data-href="https://unpkg.com/multiple-select-vanilla@5.2.0/dist/styles/css/multiple-select.css"> -->
<!-- <script id="multiple-select-js" data-src="https://unpkg.com/multiple-select-vanilla@5.2.0/dist/multiple-select.js"></script> -->

<select class="multiple-select" data-component="MultipleSelect">
  <option value="1">First</option>
  <option value="2">Second</option>
</select>
*/
