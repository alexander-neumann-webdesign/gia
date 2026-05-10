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

		// Total scrollable distance for the element within the viewport:
		// Starts when rect.top == windowHeight (element top hits viewport bottom)
		// Ends when rect.bottom == 0 (element bottom hits viewport top)
		// So total distance is windowHeight + rect.height
		const totalDistance = windowHeight + rect.height;

		// Current scrolled distance for the element:
		// When it first enters (rect.top == windowHeight), currentDistance is 0.
		// When it leaves (rect.bottom == 0), currentDistance is totalDistance.
		const currentDistance = windowHeight - rect.top;

		// Normalize progress from 0 (just entered) to 1 (just left)
		// Clamp it between 0 and 1 just in case
		let progress = currentDistance / totalDistance;
		progress = Math.max(0, Math.min(1, progress));

		// We map progress 0 -> 1 to an offset from -Speed to +Speed (or vice versa depending on intended direction)
		// Let's map it from -Speed/2 to +Speed/2 to center the image when progress is 0.5
		const mappedProgress = progress - 0.5;

		// Use percentage based on the image size
		const offsetPercent = mappedProgress * this.options.parallaxSpeed * 100;

		if (this.options.parallaxDirection === 'horizontal') {
			this.ref.img.style.transform = `translate3d(${offsetPercent}%, 0, 0)`;
		} else {
			this.ref.img.style.transform = `translate3d(0, ${offsetPercent}%, 0)`;
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
