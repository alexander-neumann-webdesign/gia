class ImageComparison extends gia.Component {
    constructor(element) {
        super(element);

        this.ref = {
            slider: null
        };

        this.ticking = false;
        this.isDragging = false;
        this.transitionTimeout = null;

        this.handleInput = this.handleInput.bind(this);
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
    }

    mount() {
        if (this.ref.slider) {
            this.ref.slider.addEventListener('input', this.handleInput);
            this.ref.slider.addEventListener('pointerdown', this.handlePointerDown);
            this.ref.slider.addEventListener('pointerup', this.handlePointerUp);
            this.ref.slider.addEventListener('pointercancel', this.handlePointerUp);
            this.ref.slider.addEventListener('pointermove', this.handlePointerMove);

            if (!this.ref.slider.hasAttribute('aria-label') && !this.ref.slider.hasAttribute('aria-labelledby')) {
                this.ref.slider.setAttribute('aria-label', 'Image comparison slider');
            }

            // Set initial state
            this.updateExposure();
        }
    }

    unmount() {
        if (this.ref.slider) {
            this.ref.slider.removeEventListener('input', this.handleInput);
            this.ref.slider.removeEventListener('pointerdown', this.handlePointerDown);
            this.ref.slider.removeEventListener('pointerup', this.handlePointerUp);
            this.ref.slider.removeEventListener('pointercancel', this.handlePointerUp);
            this.ref.slider.removeEventListener('pointermove', this.handlePointerMove);
        }
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
        }
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
    }

    handlePointerDown(e) {
        if (this.ref.slider) {
            const currentValStr = this.element.style.getPropertyValue('--exposure');
            const currentVal = currentValStr ? parseFloat(currentValStr) : 50;
            const rect = this.ref.slider.getBoundingClientRect();
            const clickPct = ((e.clientX - rect.left) / rect.width) * 100;

            if (Math.abs(clickPct - currentVal) > 3) {
                this.element.classList.add('image-comparison--transitioning');
                if (this.transitionTimeout) {
                    clearTimeout(this.transitionTimeout);
                }
                this.transitionTimeout = setTimeout(() => {
                    this.element.classList.remove('image-comparison--transitioning');
                }, 300);
            }
        }
        this.isDragging = true;
    }

    handlePointerUp() {
        this.isDragging = false;
    }

    handlePointerMove(e) {
        if (this.isDragging) {
            this.element.classList.remove('image-comparison--transitioning');
            if (this.transitionTimeout) {
                clearTimeout(this.transitionTimeout);
            }
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
