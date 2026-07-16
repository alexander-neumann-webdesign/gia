class Header extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			scrollEvents: false,
			scrollThreshold: 50, // Distance over which to scrub
			scrubTransition: false,
			hideOnScroll: true,
			hideThreshold: 50, // Minimum scroll amount before hiding/showing
			showAtBottom: false,
		};

		this.lastScrollY = 0;
		this.currentScrollY = 0;

		this.setState({
			isHidden: false,
			isScrolled: false,
		});
	}

	mount() {
		if (this.options.scrollEvents) {
			// Precompute inverse threshold for faster math in render loop
			this._invScrollThreshold = 1 / this.options.scrollThreshold;

			// Observe layout shifts instead of polling documentHeight during scroll
			this.observeResize(document.body, this.handleBodyResize);
			window.addEventListener("resize", this.handleBodyResize);
			this.handleBodyResize();

			this.observeScroll(this.handleScroll);

			// Initial check
			this.currentScrollY = window.scrollY || window.pageYOffset;
			this.update();

			// Swup integration: reset header when navigating
			if (window.swup) {
				try {
					window.swup.hooks.on("page:view", this.handleSwupPageChange);
				} catch (e) {}
			}
		}
	}

	unmount() {
		if (this.options.scrollEvents) {
			this.unobserveResize(document.body, this.handleBodyResize);
			window.removeEventListener("resize", this.handleBodyResize);
			this.unobserveScroll(this.handleScroll);

			if (window.swup) {
				try {
					window.swup.hooks.off("page:view", this.handleSwupPageChange);
				} catch (e) {}
			}
		}
	}

	handleBodyResize() {
		// Cache expensive layout reads to keep them out of the 60fps scroll loop
		this._windowHeight = window.innerHeight;
		this._documentHeight = document.documentElement.scrollHeight;
	}

	handleScroll(payload) {
		if (payload && typeof payload.scroll === "number") {
			this.currentScrollY = payload.scroll;
		} else {
			this.currentScrollY = window.scrollY || window.pageYOffset;
		}

		this.update();
	}

	handleSwupPageChange() {
		// Reset state because Swup scrolls to top
		this.lastScrollY = 0;
		this.currentScrollY = 0;
		if (this.options.scrubTransition) {
			if (this._lastHeaderProgress !== 0) {
				this.element.style.setProperty("--header-progress", "0");
				this._lastHeaderProgress = 0;
			}
		}
		this.setState({
			isHidden: false,
			isScrolled: false,
		});

		// Refresh bounds since the page content just changed completely
		this.handleBodyResize();
	}

	update() {
		const isScrolled = this.currentScrollY > 0;

		// Handle scrub transition manually via CSS custom property
		// to guarantee high performance updates (avoiding setState here)
		if (this.options.scrubTransition) {
			// Clamp progress between 0 and 1 using precomputed multiplier
			let progress = this.currentScrollY * this._invScrollThreshold;
			if (progress < 0) progress = 0;
			if (progress > 1) progress = 1;

			// Bitwise truncation to 4 decimal places for high performance caching
			const roundedProgress = (progress * 10000 | 0) / 10000;
			if (this._lastHeaderProgress !== roundedProgress) {
				this.element.style.setProperty("--header-progress", roundedProgress);
				this._lastHeaderProgress = roundedProgress;
			}
		}

		// Determine direction and hide
		let isHidden = this.state.isHidden;

		if (this.options.hideOnScroll) {
			if (this.currentScrollY > this.lastScrollY && this.currentScrollY > this.options.hideThreshold) {
				// Scrolling down past threshold
				isHidden = true;
			} else if (this.currentScrollY < this.lastScrollY) {
				// Scrolling up
				isHidden = false;
			}

			// Show at bottom if option is enabled
			if (this.options.showAtBottom && this.currentScrollY + this._windowHeight >= this._documentHeight) {
				isHidden = false;
			}
		} else {
			isHidden = false;
		}

		this.lastScrollY = this.currentScrollY;

		// Batch state update
		if (this.state.isScrolled !== isScrolled || this.state.isHidden !== isHidden) {
			this.setState({
				isScrolled,
				isHidden,
			});
		}
	}

	stateChange(stateChanges) {
		// Classes are now automatically mapped to data-is-hidden and data-is-scrolled by BaseComponent
	}
}

gia.register(Header);

/*
========================================
EXPECTED HTML
========================================

<header data-component="Header" id="main-header">
  <div class="header-inner">
    <div class="logo">Logo</div>
    <nav>Nav Items</nav>
  </div>
</header>

========================================
SUGGESTED SCSS
========================================

header[data-component="Header"] {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  transition: transform 0.3s ease, background-color 0.3s ease, padding 0.3s ease;

  // Recommended: give header a view-transition-name and elevate it
  // so it stays above transitioning elements
  view-transition-name: main-header;

  // Default values when scrubTransition is false
  padding: 2rem 0;
  background-color: transparent;

  // If scrubTransition: true is used, you can use --header-progress (0 to 1)
  // to smoothly interpolate styles instead of relying on the data-is-scrolled transition:
  // padding: calc(2rem - (1rem * var(--header-progress, 0))) 0;
  // background-color: rgba(255, 255, 255, var(--header-progress, 0));
  // box-shadow: 0 2px 10px rgba(0,0,0, calc(0.1 * var(--header-progress, 0)));

  &[data-is-scrolled="true"] {
    // Only needed if scrubTransition is false
    // padding: 1rem 0;
    // background-color: white;
    // box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  }

  &[data-is-hidden="true"] {
    transform: translateY(-100%);
  }
}

::view-transition-group(main-header) {
  z-index: 9999;
}
*/
