class ImageHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			parallaxSpeed: 0.25,
			parallaxDirection: "vertical",
			parallaxCssVar: false,
			startFromTop: false,
		};

		this.ref = {
			img: null,
		};



		// Layout caching for performance
		this.cachedLayout = {
			elementTop: 0,
			elementHeight: 0,
			windowHeight: 0,
			headerOffset: 0,
			totalDistance: 0,
			distanceOffset: 0,
		};

		// Initialize state
		this.setState({
			isNear: false,
			isVisible: false,
			isLoaded: false,
		});
	}

	mount() {
		if (!this.ref.img) {
			this.ref.img = this.element.querySelector("img");
		}

		if (!this.ref.img) return;

		// Force async decoding to prevent main thread hitches when images load during scroll
		this.ref.img.setAttribute("decoding", "async");

		if (this.ref.img.complete) {
			this.triggerLoad();
		} else {
			// gia automatically binds component methods, so .bind(this) is unnecessary
			// and avoiding it here prevents memory leaks since we can properly remove the listener later
			this.ref.img.addEventListener("load", this.handleLoad);
		}

		this.initObservers();

		if (this.options.parallaxSpeed !== 0) {
			this.initParallax();
		}
	}

	initObservers() {
		// Pre-warm observer for GPU texture upload (will-change)
		// This applies will-change 1 screen early to prevent GPU upload stutters on entry
		this.observeIntersection(this.element, this.handleNear, {
			rootMargin: "100% 0px 100% 0px",
			threshold: 0,
		});

		// Setup Intersection Observer for 'visible' class
		// We use a 1px rootMargin so the parallax transform is calculated and applied
		// exactly 1 frame before it visually enters the viewport, preventing a visual snap.
		this.observeIntersection(this.element, this.handleIntersect, {
			rootMargin: "1px 0px 1px 0px",
			threshold: 0,
		});

		// Setup Resize Observer for 'sizes' attribute
		this.observeResize(this.element, this.handleResize);
	}

	initParallax() {
		this.isScrollBound = false;
		this.currentScrollY = window.lenis ? window.lenis.scroll : window.scrollY || window.pageYOffset;
		this.windowWidth = window.innerWidth;

		// Cache the header element once if needed
		this.headerElement = document.querySelector("header#main-header");
		this.headerOffset = this.headerElement ? this.headerElement.offsetHeight : 0;

		// Calculate this ONCE. It never changes during the component's lifecycle,
		// saving valuable computation time inside the 60fps/120fps render loop.
		this.speedCalc = this.options.parallaxSpeed / (1 + Math.abs(this.options.parallaxSpeed));
		this.speedMultiplier = this.speedCalc * 100;
		this.isHorizontal = this.options.parallaxDirection === "horizontal";

		// Initial calculation based on immediate state
		this.cacheLayout();

		// Calculate exactly the extra space needed to cover the parallax translation.
		// A parallaxSpeed of 0.2 means the image covers an extra 20% of the container.
		const speed = Math.abs(this.options.parallaxSpeed);
		const extraSpacePercent = speed * 100;

		window.requestAnimationFrame(() => {
			if (!this.ref.img) return;
			if (this.options.parallaxDirection === "vertical") {
				this.ref.img.style.height = `calc(100% + ${extraSpacePercent}%)`;
				this.ref.img.style.top = `-${extraSpacePercent / 2}%`;
			} else {
				this.ref.img.style.width = `calc(100% + ${extraSpacePercent}%)`;
				this.ref.img.style.left = `-${extraSpacePercent / 2}%`;
			}
		});

		// Setup Resize Observer on document to catch layout shifts
		this.observeResize(document.body, this.handleBodyResize);

		// Also listen to global programmatic resize events (e.g., from Accordion.js)
		window.addEventListener("resize", this.handleBodyResize);

		if (!this.ticking) {
			this._frameId = window.requestAnimationFrame(this.tickUpdate);
			this.ticking = true;
		}
	}

	handleBodyResize(e) {
		// Distinguish between native browser resizes and programmatic ones (e.g., from Accordion.js)
		const isNative = e && e.isTrusted;
		const widthChanged = this.windowWidth !== window.innerWidth;

		// If it's a native resize but the width didn't change, it's just the mobile URL bar
		// hiding/showing. We explicitly ignore these to prevent the parallax math from jumping!
		if (isNative && !widthChanged) {
			return;
		}

		this.windowWidth = window.innerWidth;

		if (this.headerElement) {
			this.headerOffset = this.headerElement.offsetHeight;
		}
		this.cacheLayout();
		if (this.state.isVisible) {
			this.handleScroll({ scroll: window.lenis ? window.lenis.scroll : window.scrollY });
		} else if (!this.ticking) {
			this._frameId = window.requestAnimationFrame(this.tickUpdate);
			this.ticking = true;
		}
	}

	unmount() {
		// Manually clean up native listeners to prevent memory leaks when components are destroyed
		if (this.ref.img) {
			this.ref.img.removeEventListener("load", this.handleLoad);
		}

		if (this._frameId) {
			window.cancelAnimationFrame(this._frameId);
		}
		clearTimeout(this._resizeTimer);

		if (this.options.parallaxSpeed !== 0) {
			window.removeEventListener("resize", this.handleBodyResize);
			this.destroyParallax();
		}
	}

	destroyParallax() {
		this.unbindScroll();
	}

	bindScroll() {
		if (this.isScrollBound) return;
		this.isScrollBound = true;

		this.observeScroll(this.handleScroll);
	}

	unbindScroll() {
		if (!this.isScrollBound) return;
		this.isScrollBound = false;

		this.unobserveScroll(this.handleScroll);
	}

	handleLoad(e) {
		this.triggerLoad();
	}

	handleNear(entries) {
		const entry = entries[entries.length - 1];
		this.setState({
			isNear: entry.isIntersecting,
		});
	}

	triggerLoad() {
		if ("decode" in this.ref.img) {
			// Force the browser to decode the image off the main thread BEFORE we visually reveal it.
			// This prevents the massive CPU hitch on first-time scrolling.
			this.ref.img
				.decode()
				.then(() => {
					this.setState({ isLoaded: true });
				})
				.catch(() => {
					this.setState({ isLoaded: true });
				});
		} else {
			this.setState({ isLoaded: true });
		}
	}

	handleIntersect(entries) {
		const entry = entries[entries.length - 1];

		if (entry.isIntersecting && this.options.parallaxSpeed !== 0) {
			this.currentScrollY = window.lenis ? window.lenis.scroll : window.scrollY || window.pageYOffset;
			// Use the IntersectionObserver's pre-calculated rect to avoid Forced Synchronous Layouts
			this.cacheLayout(entry.boundingClientRect);
		}

		this.setState({
			isVisible: entry.isIntersecting,
		});
	}

	handleScroll(e) {
		if (!this.state.isVisible) return;

		// gia's scroll event object already contains the optimized scroll position
		if (e && typeof e.scroll === "number") {
			this.currentScrollY = e.scroll;
		} else {
			this.currentScrollY = window.lenis ? window.lenis.scroll : window.scrollY || window.pageYOffset;
		}

		// ⚡ BOLT OPTIMIZATION: Update synchronously since modern scroll events are natively throttled
		// and dispatched before the animation frame. Avoids 1-frame lag and layout thrashing.
		this.updateParallax();
	}

	stateChange(stateChanges) {
		if ("isVisible" in stateChanges) {
			if (this.state.isVisible) {
				if (this.options.parallaxSpeed !== 0) {
					// Dynamically bind scroll listener only when visible to save resources
					this.bindScroll();
					this.updateParallax();
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
		// Extract data synchronously because `gia` reuses the entries array globally for performance
		const entry = entries[entries.length - 1];
		if (!entry || !entry.contentRect) return;

		const width = entry.contentRect.width;
		const height = entry.contentRect.height;

		const isWidthChange = this._latestResizeWidth !== undefined && this._latestResizeWidth !== width;
		const isFirstRun = this._latestResizeWidth === undefined;

		// 1. Immediately update layout and parallax for smooth 60fps responsive resizing
		// without any "snapping" or lag. We explicitly ignore vertical-only resizes to prevent
		// parallax jumps on mobile when the URL bar hides/shows.
		if (this.options.parallaxSpeed !== 0 && (isWidthChange || isFirstRun)) {
			this.cacheLayout();
			this.updateParallax();
		}

		// 2. We keep the debounce strictly for the `sizes` update to prevent browser
		// string-parsing lag and layout recalculation bugs during the drag.
		this._latestResizeWidth = width;
		this._latestResizeHeight = height;

		clearTimeout(this._resizeTimer);
		this._resizeTimer = setTimeout(() => {
			const w = this._latestResizeWidth;
			const h = this._latestResizeHeight;
			let sizeUpdates = [];

			if (this.ref.img && w > 0) {
				const currentSizes = this.ref.img.getAttribute("sizes");

				let imgElWidth = w;
				let imgElHeight = h;

				if (this.options.parallaxSpeed !== 0) {
					const speed = Math.abs(this.options.parallaxSpeed);
					if (this.options.parallaxDirection === "vertical") {
						imgElHeight *= 1 + speed;
					} else {
						imgElWidth *= 1 + speed;
					}
				}

				let renderWidth = imgElWidth;

				const imgNaturalWidth = this.ref.img.naturalWidth || parseFloat(this.ref.img.getAttribute("width")) || imgElWidth;
				const imgNaturalHeight = this.ref.img.naturalHeight || parseFloat(this.ref.img.getAttribute("height")) || imgElHeight;

				if (imgNaturalWidth && imgNaturalHeight) {
					const imgRatio = imgNaturalWidth / imgNaturalHeight;
					const elRatio = imgElWidth / imgElHeight;

					if (elRatio < imgRatio) {
						renderWidth = imgElHeight * imgRatio;
					}
				}

				// Bin sizes to 25px intervals and only update if we need a LARGER image.
				// This heavily prevents image flashing caused by constant `sizes` changes
				// re-triggering decoding="async" or lazy loading evaluation.
				const binnedWidth = Math.ceil(renderWidth / 25) * 25;

				// Parse the current sizes to compare. If it's something like "100vw", this will be 0.
				const currentWidthMatch = currentSizes ? currentSizes.match(/^(\d+)px$/) : null;
				const currentParsedWidth = currentWidthMatch ? parseInt(currentWidthMatch[1], 10) : 0;

				if (binnedWidth > currentParsedWidth) {
					sizeUpdates.push(`${binnedWidth}px`);
				}
			}

			// Perform DOM writes LAST
			if (sizeUpdates.length > 0) {
				window.requestAnimationFrame(() => {
					if (this.ref.img) {
						// In this loop it's always the same image ref, but keeping the logic general
						this.ref.img.setAttribute("sizes", sizeUpdates[0]);
					}
				});
			}
		}, 150);
	}

	cacheLayout(rect = null) {
		if (this.options.parallaxSpeed === 0) return;

		// Fallback to synchronous DOM read only if rect isn't provided
		if (!rect) {
			rect = this.element.getBoundingClientRect();
		}

		// Prioritize currentScrollY to maintain sync with smooth scroll libraries like Lenis
		const scrollTop =
			typeof this.currentScrollY === "number"
				? this.currentScrollY
				: window.lenis
					? window.lenis.scroll
					: window.scrollY || window.pageYOffset;

		this.cachedLayout.elementHeight = rect.height;
		this.cachedLayout.elementTop = rect.top + scrollTop;
		this.cachedLayout.windowHeight = window.innerHeight;
		this.cachedLayout.headerOffset = this.headerOffset || 0;

		// Pre-compute parallax distances here instead of in the RAF loop
		if (this.options.startFromTop) {
			// Starts when rect.top == headerOffset
			// Ends when rect.bottom == 0
			this.cachedLayout.totalDistance = this.cachedLayout.elementHeight + this.cachedLayout.headerOffset;
			this.cachedLayout.distanceOffset = this.cachedLayout.headerOffset;
		} else {
			// Starts when rect.top == windowHeight
			// Ends when rect.bottom == headerOffset (hidden behind header)
			this.cachedLayout.totalDistance =
				this.cachedLayout.windowHeight - this.cachedLayout.headerOffset + this.cachedLayout.elementHeight;
			this.cachedLayout.distanceOffset = this.cachedLayout.windowHeight;
		}

		// Use multiplication instead of division in the render loop for faster CPU calculation
		this.cachedLayout.invTotalDistance = this.cachedLayout.totalDistance > 0 ? 1 / this.cachedLayout.totalDistance : 0;
	}

	updateParallax() {
		if (this.options.parallaxSpeed === 0 || !this.ref.img) return;

		// Calculate element's current position relative to viewport WITHOUT getBoundingClientRect
		const currentRectTop = this.cachedLayout.elementTop - this.currentScrollY;

		// Use the statically cached values to avoid conditional branching and math in the render loop
		const currentDistance = this.cachedLayout.distanceOffset - currentRectTop;

		// Normalize progress from 0 (just entered) to 1 (just left)
		let progress = currentDistance * this.cachedLayout.invTotalDistance;
		progress = progress < 0 ? 0 : progress > 1 ? 1 : progress;

		if (this.options.parallaxCssVar) {
			const roundedProgress = Math.round(progress * 10000) / 10000;
			if (this._lastParallaxProgress !== roundedProgress) {
				this._lastParallaxProgress = roundedProgress;
				this.element.style.setProperty("--parallax-scroll-progress", roundedProgress.toString());
			}
		} else {
			// Map progress 0 -> 1 to an offset from -Speed to +Speed
			const mappedProgress = progress - 0.5;

			// translate3d percentages are relative to the image size (H_img).
			// Since H_img = H_container * (1 + speed), we must divide the offset by (1 + speed)
			// to ensure the translation perfectly covers the extra space we added.

			// Use the pre-computed speed calculation from initParallax
			let offsetPercent = mappedProgress * this.speedMultiplier;

			// Round to 4 decimal places to prevent micro-stutters and allow caching to skip redundant DOM writes
			offsetPercent = Math.round(offsetPercent * 10000) / 10000;

			// Compare numbers instead of allocating and comparing new strings every frame
			if (this._lastOffsetPercent !== offsetPercent) {
				this._lastOffsetPercent = offsetPercent;
				const transformStr = this.isHorizontal ? `translate3d(${offsetPercent}%, 0, 0)` : `translate3d(0, ${offsetPercent}%, 0)`;
				this.ref.img.style.transform = transformStr;
			}
		}
	}
}

gia.register(ImageHolder);

/*
========================================
EXPECTED HTML
========================================

<div data-component="ImageHolder" data-options='{"parallaxSpeed": 0.2, "parallaxCssVar": false, "startFromTop": false}'>
  <img data-ref="img" src="fallback.jpg" srcset="..." sizes="100vw" alt="A nice image" loading="lazy" />
</div>

========================================
SUGGESTED SCSS
========================================

div[data-component="ImageHolder"] {
  position: relative;
  overflow: hidden;
  contain: strict;
  user-select: none;
  pointer-events: none;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 50%;
    display: block;
    
    // Use 0.001 instead of 0 to force the browser to keep it in the render tree 
    // so it respects the will-change: transform pre-warming.
    opacity: 0.001; 

    transition: opacity 0.9s ease;
  }

  // 1. Trigger the heavy GPU texture upload OFF-SCREEN to hide the stutter
  &[data-is-near="true"] img {
    will-change: transform;
  }

  // 2. Trigger the visual fade-in right as it visually enters the viewport
  &[data-is-visible="true"][data-is-loaded="true"] img {
    opacity: 1;
  }

  // --- Advanced Usage: parallaxCssVar ---
  // If "parallaxCssVar": true is passed, JS will NOT apply inline transforms.
  // Instead it sets --parallax-scroll-progress (0.0000 to 1.0000) on the ImageHolder element.
  // You can use this to drive opacity, scale, rotations, etc:
  //
  // &[data-options*='"parallaxCssVar": true'] img,
  // &[data-options*='"parallaxCssVar":true'] img {
  //   transform: scale(calc(1 + (var(--parallax-scroll-progress, 0) * 0.2)));
  // }
}
*/
