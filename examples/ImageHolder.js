class ImageHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			parallaxSpeed: 0,
			parallaxDirection: 'vertical',
			parallaxCssVar: false,
			startFromTop: false
		};

		this.ref = {
			img: null
		};

		this.ticking = false;

		// Layout caching for performance
		this.cachedLayout = {
			elementTop: 0,
			elementHeight: 0,
			windowHeight: 0,
			headerOffset: 0
		};

		// Initialize state
		this.setState({
			isVisible: false
		});
	}

	mount() {
		if (!this.ref.img) {
			this.ref.img = this.element.querySelector('img');
		}

		if (!this.ref.img) return;

		this.initObservers();

		if (this.options.parallaxSpeed !== 0) {
			this.initParallax();
		}
	}

	initObservers() {
		// Setup Intersection Observer for 'visible' class
		this.intersectionObserver = new IntersectionObserver(this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01
		});
		this.intersectionObserver.observe(this.element);

		// Setup Resize Observer for 'sizes' attribute
		this.resizeObserver = new ResizeObserver(this.handleResize);
		this.resizeObserver.observe(this.element);
	}

	initParallax() {
		this.isScrollBound = false;
		this.currentScrollY = window.scrollY || window.pageYOffset;

		// Cache the header element once if needed
		if (this.options.startFromTop) {
			this.headerElement = document.querySelector('header#main-header');
		}

		// Setup Resize Observer on document to catch layout shifts
		this.bodyResizeObserver = new ResizeObserver(() => {
			this.cacheLayout();
			if (this.state.isVisible) {
				this.handleScroll({ scroll: window.lenis ? window.lenis.scroll : window.scrollY });
			}
		});
		this.bodyResizeObserver.observe(document.body);

		// Initial calculation based on immediate state
		this.cacheLayout();
		this.updateParallax();
	}

	unmount() {
		this.destroyObservers();

		if (this.options.parallaxSpeed !== 0) {
			this.destroyParallax();
		}
	}

	destroyObservers() {
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
		}
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
	}

	destroyParallax() {
		this.unbindScroll();

		if (this.bodyResizeObserver) {
			this.bodyResizeObserver.disconnect();
		}
	}

	bindScroll() {
		if (this.isScrollBound) return;
		this.isScrollBound = true;

		if (window.lenis) {
			window.lenis.on('scroll', this.handleScroll);
		} else {
			window.addEventListener('scroll', this.handleScroll, { passive: true });
		}
	}

	unbindScroll() {
		if (!this.isScrollBound) return;
		this.isScrollBound = false;

		if (window.lenis) {
			window.lenis.off('scroll', this.handleScroll);
		} else {
			window.removeEventListener('scroll', this.handleScroll);
		}
	}

	handleIntersect(entries) {
		entries.forEach((entry) => {
			this.setState({
				isVisible: entry.isIntersecting
			});
		});
	}

	handleScroll(e) {
		if (!this.state.isVisible) return;

		// If Lenis is firing this, intercept scroll directly from event.
		// If Native scroll fired this, `e.scroll` is undefined, use window.scrollY.
		// Important: We read scrollY synchronously OUTSIDE requestAnimationFrame to avoid thrashing.
		if (e && typeof e.scroll === 'number') {
			this.currentScrollY = e.scroll;
		} else {
			this.currentScrollY = window.scrollY || window.pageYOffset;
		}

		if (!this.ticking) {
			window.requestAnimationFrame(this.tickUpdate);
			this.ticking = true;
		}
	}

	tickUpdate() {
		this.updateParallax();
		this.ticking = false;
	}

	stateChange(stateChanges) {
		if ('isVisible' in stateChanges) {
			if (this.state.isVisible) {
				this.element.classList.add('visible');

				if (this.options.parallaxSpeed !== 0) {
					// Dynamically bind scroll listener only when visible to save resources
					this.bindScroll();

					// Force a recalculation as soon as it becomes visible
					this.cacheLayout();
					this.currentScrollY = window.scrollY || window.pageYOffset;
					this.updateParallax();
				}
			} else {
				this.element.classList.remove('visible');

				if (this.options.parallaxSpeed !== 0) {
					// Dynamically unbind scroll listener when out of view
					this.unbindScroll();
				}
			}
		}
	}

	handleResize(entries) {
		let widthChanged = false;

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

				// We only care about layout caching if parallax is enabled
				if (this.options.parallaxSpeed !== 0) {
					widthChanged = true;
				}
			}
		}

		if (widthChanged) {
			this.cacheLayout();
			this.updateParallax();
		}
	}

	cacheLayout() {
		if (this.options.parallaxSpeed === 0) return;

		const rect = this.element.getBoundingClientRect();
		const scrollTop = window.scrollY || window.pageYOffset;

		this.cachedLayout.elementHeight = rect.height;
		this.cachedLayout.elementTop = rect.top + scrollTop;
		this.cachedLayout.windowHeight = window.innerHeight;

		if (this.options.startFromTop) {
			this.cachedLayout.headerOffset = this.headerElement ? this.headerElement.offsetHeight : 0;
		}
	}

	updateParallax() {
		if (this.options.parallaxSpeed === 0 || !this.ref.img) return;

		const { elementTop, elementHeight, windowHeight, headerOffset } = this.cachedLayout;

		// Calculate element's current position relative to viewport WITHOUT getBoundingClientRect
		const currentRectTop = elementTop - this.currentScrollY;

		let totalDistance;
		let currentDistance;

		if (this.options.startFromTop) {
			// Starts when rect.top == headerOffset
			// Ends when rect.bottom == 0
			totalDistance = elementHeight + headerOffset;
			currentDistance = headerOffset - currentRectTop;
		} else {
			// Starts when rect.top == windowHeight
			// Ends when rect.bottom == 0
			totalDistance = windowHeight + elementHeight;
			currentDistance = windowHeight - currentRectTop;
		}

		// Normalize progress from 0 (just entered) to 1 (just left)
		let progress = currentDistance / totalDistance;
		progress = Math.max(0, Math.min(1, progress));

		if (this.options.parallaxCssVar) {
			const roundedProgress = Math.round(progress * 10000) / 10000;
			this.element.style.setProperty('--parallax-scroll-progress', roundedProgress);
		} else {
			// Map progress 0 -> 1 to an offset from -Speed to +Speed
			const mappedProgress = progress - 0.5;
			const offsetPercent = mappedProgress * this.options.parallaxSpeed * 100;

			if (this.options.parallaxDirection === 'horizontal') {
				this.ref.img.style.transform = `translate3d(${offsetPercent}%, 0, 0)`;
			} else {
				this.ref.img.style.transform = `translate3d(0, ${offsetPercent}%, 0)`;
			}
		}
	}
}

gia.register(ImageHolder);

/**
 * Expected HTML Structure:
 *
 * <div data-component="ImageHolder" data-options='{"parallaxSpeed": 0.2, "parallaxCssVar": false, "startFromTop": false}'>
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
 *     // Entrance animation
 *     // Do NOT transition transform if parallaxSpeed is active, it will cause severe lag!
 *     transform: translateY(20px);
 *     transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1);
 *   }
 *
 *   &.visible img {
 *     opacity: 1;
 *     // If parallaxSpeed === 0, JS will not touch transform, so we can reset it here natively:
 *     // transform: translateY(0);
 *   }
 *
 *   // --- Advanced Usage: parallaxCssVar ---
 *   // If "parallaxCssVar": true is passed, JS will NOT apply inline transforms.
 *   // Instead it sets --parallax-scroll-progress (0.0000 to 1.0000) on the ImageHolder element.
 *   // You can use this to drive opacity, scale, rotations, etc:
 *   //
 *   // &[data-options*='"parallaxCssVar": true'] img,
 *   // &[data-options*='"parallaxCssVar":true'] img {
 *   //   transform: scale(calc(1 + (var(--parallax-scroll-progress, 0) * 0.2)));
 *   // }
 * }
 */
