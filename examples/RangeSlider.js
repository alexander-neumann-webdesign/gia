class RangeSlider extends gia.Component {
    constructor(element) {
        super(element);

        this.ref = {
            slider: null,
            inputs: []
        };

        this.options = {
            start: [0, 100],
            connect: true,
            range: {
                'min': 0,
                'max': 100
            },
            step: 1
        };

        this.sliderInstance = null;
        this.handleInputChange = this.handleInputChange.bind(this);
    }

    async require() {
        if (typeof window.noUiSlider === "undefined") {
            await Promise.all([
                this.loadScript("nouislider-js", "noUiSlider"),
                this.loadStyle("nouislider-css")
            ]);
        }
    }

    mount() {
        if (!window.noUiSlider) {
            console.error("RangeSlider: noUiSlider is not loaded.");
            return;
        }

        const sliderElement = this.ref.slider || this.element;

        this.sliderInstance = window.noUiSlider.create(sliderElement, this.options);

        // Sync slider changes to inputs
        if (this.ref.inputs && this.ref.inputs.length > 0) {
            this.sliderInstance.on('update', (values, handle) => {
                if (this.ref.inputs[handle]) {
                    this.ref.inputs[handle].value = values[handle];

                    // Dispatch events so other components (like Form) can react
                    this.ref.inputs[handle].dispatchEvent(new Event('input', { bubbles: true }));
                    this.ref.inputs[handle].dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            // Sync input changes to slider
            this.ref.inputs.forEach((input, index) => {
                input.addEventListener('change', this.handleInputChange);
            });
        }
    }

    handleInputChange(event) {
        const input = event.target;
        const index = this.ref.inputs.indexOf(input);
        if (index > -1 && this.sliderInstance) {
            const values = [];
            values[index] = input.value;
            this.sliderInstance.set(values);
        }
    }

    unmount() {
        if (this.ref.inputs && this.ref.inputs.length > 0) {
            this.ref.inputs.forEach((input) => {
                input.removeEventListener('change', this.handleInputChange);
            });
        }

        if (this.sliderInstance) {
            this.sliderInstance.destroy();
            this.sliderInstance = null;
        }
    }
}

gia.register(RangeSlider);

/*
Expected HTML Structure:

<div data-component="RangeSlider" data-options='{"start": [20, 80], "range": {"min": 0, "max": 100}}'>
    <div data-ref="slider"></div>

    <div style="margin-top: 1rem; display: flex; gap: 1rem;">
        <input type="number" data-ref="inputs" />
        <input type="number" data-ref="inputs" />
    </div>
</div>
*/