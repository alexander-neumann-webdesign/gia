class ScrollEffect extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			threshold: 0.15, // Percentage of element that must be visible to trigger isInview (0 to 1)
			rootMargin: "0px",
			startFromTop: false, // If true, progress starts from 0 when element top hits viewport top
			cssVar: "--scroll-progress", // The CSS variable to update
		};

		this.ticking = false;
		this.isScrollBound = false;

		// Layout caching for performance
		this.cachedLayout = {
			elementTop: 0,
			elementHeight: 0,
			windowHeight: 0,
			totalDistance: 0,
			distanceOffset: 0,
			invTotalDistance: 0,
		};

		this.setState({
			isInview: false,
			isVisibleForProgress: false,
		});
	}

	mount() {
		// 1. Setup Intersection Observer for 'isInview' state (similar to Reveal.js)
		this.observeIntersection(this.element, this.handleIntersect, {
			threshold: this.options.threshold,
			rootMargin: this.options.rootMargin,
		});

		// 2. Setup Intersection Observer for scroll progress calculations
		// We use a 1px rootMargin so it triggers exactly when it enters/leaves viewport
		this.observeIntersection(this.element, this.handleProgressIntersect, {
			rootMargin: "1px 0px 1px 0px",
			threshold: 0,
		});

		// 3. Setup Resize Observer to recalculate layout dimensions
		this.observeResize(this.element, this.handleResize);

		// Initial calculation
		this.currentScrollY = window.lenis ? window.lenis.scroll : window.scrollY || window.pageYOffset;
		this.cacheLayout();
	}

	unmount() {
		this.unbindScroll();
		if (this.tickTask) gia.clear(this.tickTask);
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

	handleIntersect(entries) {
		const entry = entries[entries.length - 1];
		if (!entry) return;

		// Note: The `isInview` state will automatically be mapped to the `data-is-inview` attribute
		// by the BaseComponent's state-to-attribute mapping.
		this.setState({ isInview: entry.isIntersecting });
	}

	handleProgressIntersect(entries) {
		const entry = entries[entries.length - 1];
		if (!entry) return;

		if (entry.isIntersecting) {
			this.currentScrollY = window.lenis ? window.lenis.scroll : window.scrollY || window.pageYOffset;
			// Use the IntersectionObserver's pre-calculated rect to avoid Forced Synchronous Layouts
			this.cacheLayout(entry.boundingClientRect);
		}

		this.setState({ isVisibleForProgress: entry.isIntersecting });
	}

	handleResize(entries) {
		const entry = entries[entries.length - 1];
		if (!entry || !entry.contentRect) return;

		this.cacheLayout();
		if (!this.ticking) {
			this.tickTask = gia.mutate(this.tickUpdate);
			this.ticking = true;
		}
	}

	handleScroll(e) {
		if (!this.state.isVisibleForProgress) return;

		// gia's scroll event object already contains the optimized scroll position
		if (e && typeof e.scroll === "number") {
			this.currentScrollY = e.scroll;
		} else {
			this.currentScrollY = window.lenis ? window.lenis.scroll : window.scrollY || window.pageYOffset;
		}

		// Execute synchronously to eliminate 1-frame latency.
		// Since updateProgress() only performs DOM writes and no reads, it's safe from Layout Thrashing
		this.updateProgress();
	}

	tickUpdate() {
		this.updateProgress();
		this.ticking = false;
	}

	stateChange(stateChanges) {
		if ("isVisibleForProgress" in stateChanges) {
			if (this.state.isVisibleForProgress) {
				// Dynamically bind scroll listener only when visible to save resources
				this.bindScroll();
				if (!this.ticking) {
					this.tickTask = gia.mutate(this.tickUpdate);
					this.ticking = true;
				}
			} else {
				// Dynamically unbind scroll listener when out of view
				this.unbindScroll();
			}
		}
	}

	cacheLayout(rect = null) {
		// Fallback to synchronous DOM read only if rect isn't provided
		if (!rect) {
			rect = this.element.getBoundingClientRect();
		}

		const scrollTop =
			typeof this.currentScrollY === "number"
				? this.currentScrollY
				: window.lenis
					? window.lenis.scroll
					: window.scrollY || window.pageYOffset;

		this.cachedLayout.elementHeight = rect.height;
		this.cachedLayout.elementTop = rect.top + scrollTop;
		this.cachedLayout.windowHeight = window.innerHeight;

		// Pre-compute parallax distances here instead of in the RAF loop
		if (this.options.startFromTop) {
			// Starts when element is at top of screen
			this.cachedLayout.totalDistance = this.cachedLayout.elementHeight;
			this.cachedLayout.distanceOffset = 0;
		} else {
			// Starts when element enters from bottom, ends when leaves top
			this.cachedLayout.totalDistance = this.cachedLayout.windowHeight + this.cachedLayout.elementHeight;
			this.cachedLayout.distanceOffset = this.cachedLayout.windowHeight;
		}

		// Use multiplication instead of division in the render loop for faster CPU calculation
		this.cachedLayout.invTotalDistance = this.cachedLayout.totalDistance > 0 ? 1 / this.cachedLayout.totalDistance : 0;
	}

	updateProgress() {
		// Use the statically cached values to avoid conditional branching and math in the render loop
		const currentDistance = this.cachedLayout.distanceOffset - (this.cachedLayout.elementTop - this.currentScrollY);

		// Normalize progress from 0 (just entered) to 1 (just left)
		let progress = currentDistance * this.cachedLayout.invTotalDistance;
		if (progress < 0) progress = 0;
		else if (progress > 1) progress = 1;

		// Bitwise truncation to 4 decimal places to prevent micro-stutters and allow caching
		const roundedProgress = (progress * 10000 | 0) / 10000;

		if (this._lastProgress !== roundedProgress) {
			this._lastProgress = roundedProgress;
			this.element.style.setProperty(this.options.cssVar, roundedProgress);
		}
	}
}

gia.register(ScrollEffect, { priority: 90 });
