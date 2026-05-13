class Header extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			scrollEvents: true,
			scrollThreshold: 50, // Distance over which to scrub
			scrubTransition: false,
			hideOnScroll: true,
			hideThreshold: 50 // Minimum scroll amount before hiding/showing
		};

		this.lastScrollY = 0;
		this.currentScrollY = 0;
		this.ticking = false;

		this.setState({
			isHidden: false,
			isScrolled: false
		});
	}

	mount() {
		if (this.options.scrollEvents) {
			// Lenis scroll listener or fallback to Native scroll
			if (window.lenis) {
				window.lenis.on('scroll', this.handleLenisScroll);
			} else {
				window.addEventListener('scroll', this.handleScroll, { passive: true });
			}

			// Initial check
			this.currentScrollY = window.scrollY || window.pageYOffset;
			this.update();

			// Swup integration: reset header when navigating
			if (window.swup) {
				window.swup.hooks.on("page:view", this.handleSwupPageChange);
			}
		}
	}

	unmount() {
		if (this.options.scrollEvents) {
			if (window.lenis) {
				window.lenis.off('scroll', this.handleLenisScroll);
			} else {
				window.removeEventListener('scroll', this.handleScroll);
			}

			if (window.swup) {
				window.swup.hooks.off("page:view", this.handleSwupPageChange);
			}
		}
	}

	handleScroll() {
		// Read scroll synchronously before rAF to avoid thrashing
		this.currentScrollY = window.scrollY || window.pageYOffset;

		if (!this.ticking) {
			window.requestAnimationFrame(this.tickUpdate);
			this.ticking = true;
		}
	}

	handleLenisScroll(e) {
		// Bypass reading window.scrollY entirely
		this.currentScrollY = e.scroll;

		if (!this.ticking) {
			window.requestAnimationFrame(this.tickUpdate);
			this.ticking = true;
		}
	}

	tickUpdate() {
		this.update();
		this.ticking = false;
	}

	handleSwupPageChange() {
		// Reset state because Swup scrolls to top
		this.lastScrollY = 0;
		this.currentScrollY = 0;
		if (this.options.scrubTransition) {
			if (this._lastHeaderProgress !== '0') {
				this.element.style.setProperty('--header-progress', '0');
				this._lastHeaderProgress = '0';
			}
		}
		this.setState({
			isHidden: false,
			isScrolled: false
		});
	}

	update() {
		const isScrolled = this.currentScrollY > 0;

		// Handle scrub transition manually via CSS custom property
		// to guarantee high performance updates (avoiding setState here)
		if (this.options.scrubTransition) {
			// Clamp progress between 0 and 1
			let progress = this.currentScrollY / this.options.scrollThreshold;
			if (progress < 0) progress = 0;
			if (progress > 1) progress = 1;

			// We only want to set the property if it has changed, or unconditionally since this is a raf frame
			// and setting custom properties is fast, but let's just set it
			const progressStr = progress.toString();
			if (this._lastHeaderProgress !== progressStr) {
				this.element.style.setProperty('--header-progress', progressStr);
				this._lastHeaderProgress = progressStr;
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
		} else {
			isHidden = false;
		}

		this.lastScrollY = this.currentScrollY;

		// Batch state update
		if (this.state.isScrolled !== isScrolled || this.state.isHidden !== isHidden) {
			this.setState({
				isScrolled,
				isHidden
			});
		}
	}

	stateChange(stateChanges) {
		// Classes are now automatically mapped to data-is-hidden and data-is-scrolled by BaseComponent
	}
}

gia.register(Header);

/**
 * Expected HTML Structure:
 *
 * <header data-component="Header" id="main-header">
 *   <div class="header-inner">
 *     <div class="logo">Logo</div>
 *     <nav>Nav Items</nav>
 *   </div>
 * </header>
 *
 * Suggested SCSS:
 *
 * header[data-component="Header"] {
 *   position: fixed;
 *   top: 0;
 *   left: 0;
 *   width: 100%;
 *   transition: transform 0.3s ease, background-color 0.3s ease, padding 0.3s ease;
 *
 *   // Default values when scrubTransition is false
 *   padding: 2rem 0;
 *   background-color: transparent;
 *
 *   // If scrubTransition: true is used, you can use --header-progress (0 to 1)
 *   // to smoothly interpolate styles instead of relying on the data-is-scrolled transition:
 *   // padding: calc(2rem - (1rem * var(--header-progress, 0))) 0;
 *   // background-color: rgba(255, 255, 255, var(--header-progress, 0));
 *   // box-shadow: 0 2px 10px rgba(0,0,0, calc(0.1 * var(--header-progress, 0)));
 *
 *   &[data-is-scrolled="true"] {
 *     // Only needed if scrubTransition is false
 *     // padding: 1rem 0;
 *     // background-color: white;
 *     // box-shadow: 0 2px 10px rgba(0,0,0,0.1);
 *   }
 *
 *   &[data-is-hidden="true"] {
 *     transform: translateY(-100%);
 *   }
 * }
 */
