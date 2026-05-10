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
			window.requestAnimationFrame(() => {
				this.update();
				this.ticking = false;
			});
			this.ticking = true;
		}
	}

	handleLenisScroll(e) {
		// Bypass reading window.scrollY entirely
		this.currentScrollY = e.scroll;

		if (!this.ticking) {
			window.requestAnimationFrame(() => {
				this.update();
				this.ticking = false;
			});
			this.ticking = true;
		}
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
		if ('isHidden' in stateChanges) {
			if (this.state.isHidden) {
				this.element.classList.add('is-hidden');
			} else {
				this.element.classList.remove('is-hidden');
			}
		}

		if ('isScrolled' in stateChanges) {
			if (this.state.isScrolled) {
				this.element.classList.add('is-scrolled');
			} else {
				this.element.classList.remove('is-scrolled');
			}
		}
	}
}

gia.register(Header);
