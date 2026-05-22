const activeImageHolders = new Set();
let isGlobalScrollBound = false;

function handleGlobalScroll(e) {
	if (activeImageHolders.size === 0) return;

	// Read scrollY once for all instances
	let currentScrollY;
	if (e && typeof e.scroll === 'number') {
		currentScrollY = e.scroll;
	} else {
		currentScrollY = window.scrollY || window.pageYOffset;
	}

	for (const instance of activeImageHolders) {
		// Only trigger updates for visible instances to save resources
		// ⚡ BOLT OPTIMIZATION: Bypass getter overhead in high-frequency event handlers
		if (!instance._state.isVisible) continue;

		instance.currentScrollY = currentScrollY;
		if (!instance.ticking) {
			instance._frameId = window.requestAnimationFrame(instance.tickUpdate);
			instance.ticking = true;
		}
	}
}

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
		this._frameId = null;

		// Layout caching for performance
		this.cachedLayout = {
			elementTop: 0,
			elementHeight: 0,
			windowHeight: 0,
			headerOffset: 0
		};

		// Initialize state
		this.setState({
			isVisible: false,
			isLoaded: false
		});
	}

	mount() {
		if (!this.ref.img) {
			this.ref.img = this.element.querySelector('img');
		}

		if (!this.ref.img) return;

		if (this.ref.img.complete) {
			this.setState({ isLoaded: true });
		} else {
			this.ref.img.addEventListener('load', this.handleLoad.bind(this));
		}

		this.initObservers();

		if (this.options.parallaxSpeed !== 0) {
			this.initParallax();
		}
	}

	initObservers() {
		// Setup Intersection Observer for 'visible' class
		this.observeIntersection(this.element, this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01
		});

		// Setup Resize Observer for 'sizes' attribute
		this.observeResize(this.element, this.handleResize);
	}

	initParallax() {
		this.isScrollBound = false;
		this.currentScrollY = window.scrollY || window.pageYOffset;

		// Cache the header element once if needed
		if (this.options.startFromTop) {
			this.headerElement = document.querySelector('header#main-header');
		}

		// Initial calculation based on immediate state
		this.cacheLayout();

		// Calculate exactly the extra space needed to cover the parallax translation.
		// A parallaxSpeed of 0.2 means the image covers an extra 20% of the container.
		const speed = Math.abs(this.options.parallaxSpeed);
		const extraSpacePercent = speed * 100;

		if (this.options.parallaxDirection === 'vertical') {
			this.ref.img.style.height = `calc(100% + ${extraSpacePercent}%)`;
			this.ref.img.style.top = `-${extraSpacePercent / 2}%`;
		} else {
			this.ref.img.style.width = `calc(100% + ${extraSpacePercent}%)`;
			this.ref.img.style.left = `-${extraSpacePercent / 2}%`;
		}

		// Setup Resize Observer on document to catch layout shifts
		this.observeResize(document.body, this.handleBodyResize);

		if (!this.ticking) {
			this._frameId = window.requestAnimationFrame(this.tickUpdate);
			this.ticking = true;
		}
	}

	handleBodyResize() {
		this.cacheLayout();
		if (this.state.isVisible) {
			this.handleScroll({ scroll: window.lenis ? window.lenis.scroll : window.scrollY });
		} else if (!this.ticking) {
			this._frameId = window.requestAnimationFrame(this.tickUpdate);
			this.ticking = true;
		}
	}

	unmount() {
		if (this._frameId) {
			window.cancelAnimationFrame(this._frameId);
		}
		if (this.options.parallaxSpeed !== 0) {
			this.destroyParallax();
		}
	}

	destroyParallax() {
		this.unbindScroll();
	}

	bindScroll() {
		if (this.isScrollBound) return;
		this.isScrollBound = true;

		activeImageHolders.add(this);

		if (!isGlobalScrollBound) {
			if (window.lenis) {
				window.lenis.on('scroll', handleGlobalScroll);
			} else {
				window.addEventListener('scroll', handleGlobalScroll, { passive: true });
			}
			isGlobalScrollBound = true;
		}
	}

	unbindScroll() {
		if (!this.isScrollBound) return;
		this.isScrollBound = false;

		activeImageHolders.delete(this);

		if (activeImageHolders.size === 0 && isGlobalScrollBound) {
			if (window.lenis) {
				window.lenis.off('scroll', handleGlobalScroll);
			} else {
				window.removeEventListener('scroll', handleGlobalScroll);
			}
			isGlobalScrollBound = false;
		}
	}

	handleLoad(e) {
		this.setState({ isLoaded: true });
	}

	handleIntersect(entries) {
		const entry = entries[entries.length - 1];

		// If becoming visible, perform synchronous layout read here to prevent thrashing
		// during the subsequent asynchronous stateChange loop
		if (entry.isIntersecting && this.options.parallaxSpeed !== 0) {
			this.cacheLayout();
			this.currentScrollY = window.scrollY || window.pageYOffset;
		}

		this.setState({
			isVisible: entry.isIntersecting
		});
	}

	tickUpdate() {
		this.updateParallax();
		this.ticking = false;
		this._frameId = null;
	}

	stateChange(stateChanges) {
		if ('isVisible' in stateChanges) {
			if (this.state.isVisible) {
				if (this.options.parallaxSpeed !== 0) {
					// Dynamically bind scroll listener only when visible to save resources
					this.bindScroll();

					if (!this.ticking) {
						this._frameId = window.requestAnimationFrame(this.tickUpdate);
						this.ticking = true;
					}
				}
			} else {
				if (this.options.parallaxSpeed !== 0) {
					// Dynamically unbind scroll listener when out of view
					this.unbindScroll();
				}
			}
		}
	}

	handleResize(entries) {
		let widthChanged = false;
		let sizeUpdates = [];

		for (let entry of entries) {
			const width = entry.contentRect.width;
			// For sizes, the browser automatically applies the device pixel ratio to srcset selections,
			// so defining the actual render width in CSS pixels is exactly what the sizes attribute needs.
			if (this.ref.img && width > 0) {
				const currentSizes = this.ref.img.getAttribute('sizes');
				const newSizes = `${Math.ceil(width)}px`;

				if (currentSizes !== newSizes) {
					sizeUpdates.push(newSizes);
				}

				// We only care about layout caching if parallax is enabled
				if (this.options.parallaxSpeed !== 0) {
					widthChanged = true;
				}
			}
		}

		// Perform layout read FIRST before any DOM writes to prevent thrashing
		if (widthChanged) {
			this.cacheLayout();
			if (!this.ticking) {
				this._frameId = window.requestAnimationFrame(this.tickUpdate);
				this.ticking = true;
			}
		}

		// Perform DOM writes LAST
		if (sizeUpdates.length > 0) {
			// In this loop it's always the same image ref, but keeping the logic general
			this.ref.img.setAttribute('sizes', sizeUpdates[0]);
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
			const progressStr = roundedProgress.toString();
			if (this._lastParallaxProgress !== progressStr) {
				this.element.style.setProperty('--parallax-scroll-progress', progressStr);
				this._lastParallaxProgress = progressStr;
			}
		} else {
			// Map progress 0 -> 1 to an offset from -Speed to +Speed
			const mappedProgress = progress - 0.5;

			// translate3d percentages are relative to the image size (H_img).
			// Since H_img = H_container * (1 + speed), we must divide the offset by (1 + speed)
			// to ensure the translation perfectly covers the extra space we added.
			const speedCalc = this.options.parallaxSpeed / (1 + Math.abs(this.options.parallaxSpeed));
			let offsetPercent = mappedProgress * speedCalc * 100;

			// Round to 4 decimal places to prevent micro-stutters and allow caching to skip redundant DOM writes
			offsetPercent = Math.round(offsetPercent * 10000) / 10000;

			const transformStr = this.options.parallaxDirection === 'horizontal'
				? `translate3d(${offsetPercent}%, 0, 0)`
				: `translate3d(0, ${offsetPercent}%, 0)`;

			if (this._lastTransform !== transformStr) {
				this.ref.img.style.transform = transformStr;
				this._lastTransform = transformStr;
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
 *     position: absolute;
 *     top: 0;
 *     left: 0;
 *     width: 100%;
 *     height: 100%;
 *     object-fit: cover;
 *     object-position: center;
 *     display: block;
 *     opacity: 0;
 *     will-change: transform;
 *
 *     transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1);
 *   }
 *
 *   &[data-is-visible="true"][data-is-loaded="true"] img {
 *     opacity: 1;
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
