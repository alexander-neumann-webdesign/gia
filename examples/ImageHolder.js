class ImageHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			parallaxSpeed: 0, // Option for smooth parallax scrolling. 0 means no parallax.
			parallaxDirection: 'vertical', // 'vertical' or 'horizontal'
		};

		this.img = this.element.querySelector('img');

		this.isVisible = false;
		this.rafId = null;
		this.lastScrollY = window.scrollY;
	}

	mount() {
		if (!this.img) return;

		// Setup Intersection Observer for 'visible' class and triggering parallax animation
		this.intersectionObserver = new IntersectionObserver(this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01
		});
		this.intersectionObserver.observe(this.element);

		// Setup Resize Observer for 'sizes' attribute
		this.resizeObserver = new ResizeObserver(this.handleResize);
		this.resizeObserver.observe(this.element);

		if (this.options.parallaxSpeed !== 0) {
			// Pre-calculate some values if needed and start the render loop
			this.updateParallax();
		}
	}

	unmount() {
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
		}
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
		if (this.rafId) {
			cancelAnimationFrame(this.rafId);
		}
	}

	handleIntersect(entries) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				this.element.classList.add('visible');
				this.isVisible = true;

				if (this.options.parallaxSpeed !== 0 && !this.rafId) {
					this.lastScrollY = window.scrollY;
					this.rafId = requestAnimationFrame(this.tick);
				}
			} else {
				this.element.classList.remove('visible');
				this.isVisible = false;

				if (this.rafId) {
					cancelAnimationFrame(this.rafId);
					this.rafId = null;
				}
			}
		});
	}

	handleResize(entries) {
		for (let entry of entries) {
			const width = entry.contentRect.width;
			// For sizes, the browser automatically applies the device pixel ratio to srcset selections,
			// so defining the actual render width in CSS pixels is exactly what the sizes attribute needs.
			if (this.img && width > 0) {
				const currentSizes = this.img.getAttribute('sizes');
				const newSizes = `${Math.ceil(width)}px`;

				if (currentSizes !== newSizes) {
					this.img.setAttribute('sizes', newSizes);
				}
			}
		}
	}

	tick() {
		if (!this.isVisible) return;

		this.updateParallax();

		this.rafId = requestAnimationFrame(this.tick);
	}

	updateParallax() {
		if (this.options.parallaxSpeed === 0 || !this.img) return;

		const rect = this.element.getBoundingClientRect();
		const windowHeight = window.innerHeight;

		// progress ranges from -1 (bottom of viewport) to 1 (top of viewport)
		const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
		const progress = centerOffset / (windowHeight / 2);

		const offset = progress * this.options.parallaxSpeed * -100; // Multiplier to give speed a sensible range

		if (this.options.parallaxDirection === 'horizontal') {
			this.img.style.transform = `translate3d(${offset}px, 0, 0)`;
		} else {
			this.img.style.transform = `translate3d(0, ${offset}px, 0)`;
		}
	}
}

gia.register(ImageHolder);
