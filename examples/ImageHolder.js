class ImageHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			parallaxSpeed: 0, // Option for smooth parallax scrolling. 0 means no parallax.
			parallaxDirection: 'vertical', // 'vertical' or 'horizontal'
		};

		this.ref = {
			img: null
		};

		this.rafId = null;

		// Initialize state
		this.setState({
			isVisible: false
		});
	}

	mount() {
		if (!this.ref.img) return;

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
			this.setState({
				isVisible: entry.isIntersecting
			});
		});
	}

	stateChange(stateChanges) {
		if ('isVisible' in stateChanges) {
			if (this.state.isVisible) {
				this.element.classList.add('visible');

				if (this.options.parallaxSpeed !== 0 && !this.rafId) {
					this.rafId = requestAnimationFrame(this.tick);
				}
			} else {
				this.element.classList.remove('visible');

				if (this.rafId) {
					cancelAnimationFrame(this.rafId);
					this.rafId = null;
				}
			}
		}
	}

	handleResize(entries) {
		for (let entry of entries) {
			const width = entry.contentRect.width;
			// For sizes, the browser automatically applies the device pixel ratio to srcset selections,
			// so defining the actual render width in CSS pixels is exactly what the sizes attribute needs.
			if (this.ref.img && width > 0) {
				const currentSizes = this.ref.img.getAttribute('sizes');
				const newSizes = `${Math.ceil(width)}px`;

				if (currentSizes !== newSizes) {
					this.ref.img.setAttribute('sizes', newSizes);
				}
			}
		}
	}

	tick() {
		if (!this.state.isVisible) return;

		this.updateParallax();

		this.rafId = requestAnimationFrame(this.tick);
	}

	updateParallax() {
		if (this.options.parallaxSpeed === 0 || !this.ref.img) return;

		const rect = this.element.getBoundingClientRect();
		const windowHeight = window.innerHeight;

		// progress ranges from -1 (bottom of viewport) to 1 (top of viewport)
		const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
		const progress = centerOffset / (windowHeight / 2);

		const offset = progress * this.options.parallaxSpeed * -100; // Multiplier to give speed a sensible range

		if (this.options.parallaxDirection === 'horizontal') {
			this.ref.img.style.transform = `translate3d(${offset}px, 0, 0)`;
		} else {
			this.ref.img.style.transform = `translate3d(0, ${offset}px, 0)`;
		}
	}
}

gia.register(ImageHolder);

/**
 * Expected HTML Structure:
 *
 * <div data-component="ImageHolder" data-options='{"parallaxSpeed": 0.2}'>
 *   <img data-ref="img" src="fallback.jpg" srcset="..." sizes="100vw" alt="A nice image" loading="lazy" />
 * </div>
 *
 * Suggested SCSS:
 *
 * div[data-component="ImageHolder"] {
 *   overflow: hidden;
 *   position: relative;
 *
 *   img {
 *     width: 100%;
 *     height: auto;
 *     display: block;
 *     opacity: 0;
 *     transform: translateY(20px); // Only if no parallax is used
 *     transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
 *     will-change: transform;
 *   }
 *
 *   &.visible img {
 *     opacity: 1;
 *     transform: translateY(0); // Only if no parallax is used, parallax overrides this inline
 *   }
 * }
 */
