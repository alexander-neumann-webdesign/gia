class ImageComparison extends gia.Component {
    constructor(element) {
        super(element);

        this.ref = {
            slider: null
        };

        this.ticking = false;
        this.handleInput = this.handleInput.bind(this);
    }

    mount() {
        if (this.ref.slider) {
            this.ref.slider.addEventListener('input', this.handleInput);
            // Set initial state
            this.updateExposure();
        }
    }

    unmount() {
        if (this.ref.slider) {
            this.ref.slider.removeEventListener('input', this.handleInput);
        }
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
    }

    handleInput() {
        if (!this.ticking) {
            this.rafId = requestAnimationFrame(() => {
                this.updateExposure();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updateExposure() {
        if (this.ref.slider) {
            const val = this.ref.slider.value;
            this.element.style.setProperty('--exposure', `${val}%`);
        }
    }
}
gia.register(ImageComparison);
