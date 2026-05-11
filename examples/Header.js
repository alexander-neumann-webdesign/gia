class Header extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			scrollEvents: true,
			scrollThreshold: 50 // Minimum scroll amount before hiding/showing
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
		this.setState({
			isHidden: false,
			isScrolled: false
		});
	}

	update() {
		const isScrolled = this.currentScrollY > 0;

		// Determine direction
		let isHidden = this.state.isHidden;

		if (this.currentScrollY > this.lastScrollY && this.currentScrollY > this.options.scrollThreshold) {
			// Scrolling down past threshold
			isHidden = true;
		} else if (this.currentScrollY < this.lastScrollY) {
			// Scrolling up
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
 *   padding: 2rem 0;
 *   background-color: transparent;
 *
 *   &[data-is-scrolled="true"] {
 *     padding: 1rem 0;
 *     background-color: white;
 *     box-shadow: 0 2px 10px rgba(0,0,0,0.1);
 *   }
 *
 *   &[data-is-hidden="true"] {
 *     transform: translateY(-100%);
 *   }
 * }
 */
