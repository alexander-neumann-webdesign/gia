class ImageHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			parallax: false,
			startFromTop: false
		};

		this.ref = {
			img: null
		};

		this.ticking = false;

		// Initialize state
		this.setState({
			isVisible: false
		});
	}

	mount() {
		if (!this.ref.img) return;

		// Setup Intersection Observer for 'visible' class
		this.intersectionObserver = new IntersectionObserver(this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01
		});
		this.intersectionObserver.observe(this.element);

		// Setup Resize Observer for 'sizes' attribute
		this.resizeObserver = new ResizeObserver(this.handleResize);
		this.resizeObserver.observe(this.element);

		if (this.options.parallax) {
			if (window.lenis) {
				window.lenis.on('scroll', this.handleScroll);
			} else {
				window.addEventListener('scroll', this.handleScroll, { passive: true });
			}

			// Setup Resize Observer on document to catch layout shifts
			this.bodyResizeObserver = new ResizeObserver(this.handleScroll);
			this.bodyResizeObserver.observe(document.body);

			// Initial check
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
		if (this.options.parallax) {
			if (window.lenis) {
				window.lenis.off('scroll', this.handleScroll);
			} else {
				window.removeEventListener('scroll', this.handleScroll);
			}

			if (this.bodyResizeObserver) {
				this.bodyResizeObserver.disconnect();
			}
		}
	}

	handleIntersect(entries) {
		entries.forEach((entry) => {
			this.setState({
				isVisible: entry.isIntersecting
			});
		});
	}

	handleScroll() {
		if (!this.state.isVisible) return;

		if (!this.ticking) {
			window.requestAnimationFrame(() => {
				this.updateParallax();
				this.ticking = false;
			});
			this.ticking = true;
		}
	}

	stateChange(stateChanges) {
		if ('isVisible' in stateChanges) {
			if (this.state.isVisible) {
				this.element.classList.add('visible');

				// Force a recalculation as soon as it becomes visible
				if (this.options.parallax) {
					this.updateParallax();
				}
			} else {
				this.element.classList.remove('visible');
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

	updateParallax() {
		if (!this.options.parallax) return;

		const rect = this.element.getBoundingClientRect();
		const windowHeight = window.innerHeight;

		let totalDistance;
		let currentDistance;

		if (this.options.startFromTop) {
			// Find the main header to determine offset
			const header = document.querySelector('header#main-header');
			const headerOffset = header ? header.getBoundingClientRect().bottom : 0;

			// Starts when rect.top == headerOffset
			// Ends when rect.bottom == 0
			totalDistance = rect.height + headerOffset;
			currentDistance = headerOffset - rect.top;
		} else {
			// Starts when rect.top == windowHeight
			// Ends when rect.bottom == 0
			totalDistance = windowHeight + rect.height;
			currentDistance = windowHeight - rect.top;
		}

		// Normalize progress from 0 (just entered) to 1 (just left)
		let progress = currentDistance / totalDistance;
		progress = Math.max(0, Math.min(1, progress));

		// Set CSS variable
		this.element.style.setProperty('--scroll-progress', progress.toFixed(4));
	}
}

gia.register(ImageHolder);

/**
 * Expected HTML Structure:
 *
 * <div data-component="ImageHolder" data-options='{"parallax": true, "startFromTop": false}'>
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
 *     will-change: transform;
 *
 *     // Default entrance animation if parallax is false
 *     transform: translateY(20px);
 *     transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
 *   }
 *
 *   &.visible img {
 *     opacity: 1;
 *     // Only if no parallax is used
 *     transform: translateY(0);
 *   }
 *
 *   // If parallax is true, we use the --scroll-progress CSS variable (0.0000 to 1.0000)
 *   // We map progress 0 -> 1 to -10% to +10% transform. Center it when progress is 0.5.
 *   &[data-options*='"parallax": true'] img,
 *   &[data-options*='"parallax":true'] img {
 *     // Calculate parallax: (progress * 20%) - 10%
 *     transform: translate3d(0, calc((var(--scroll-progress, 0.5) * 20%) - 10%), 0);
 *
 *     // Make sure we remove the transition for transform, otherwise parallax lags!
 *     transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1);
 *   }
 * }
 */
