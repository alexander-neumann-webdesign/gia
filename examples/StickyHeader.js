/**
 * Expected HTML Structure:
 *
 * <header data-component="StickyHeader">
 *   <div class="inner">
 *     <h1>Site Title</h1>
 *     <nav>...</nav>
 *   </div>
 * </header>
 *
 * Suggested SCSS:
 *
 * header[data-component="StickyHeader"] {
 *   position: sticky;
 *   top: 0;
 *   width: 100%;
 *   z-index: 100;
 *   transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
 *   will-change: transform;
 *
 *   &.is-hidden {
 *     transform: translateY(-100%);
 *   }
 *
 *   &.is-scrolled {
 *     box-shadow: 0 4px 10px rgba(0,0,0,0.1);
 *     background-color: white;
 *   }
 * }
 */

class StickyHeader extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			scrollThreshold: 50 // Minimum scroll amount before hiding/showing
		};

		this.lastScrollY = 0;
		this.ticking = false;

		this.setState({
			isHidden: false,
			isScrolled: false
		});
	}

	mount() {
		// Native scroll listener
		window.addEventListener('scroll', this.handleScroll, { passive: true });

		// Lenis scroll listener
		if (window.lenis) {
			window.lenis.on('scroll', this.handleLenisScroll);
		}

		// Initial check
		this.update(window.scrollY);
	}

	unmount() {
		window.removeEventListener('scroll', this.handleScroll);

		if (window.lenis) {
			window.lenis.off('scroll', this.handleLenisScroll);
		}
	}

	handleScroll() {
		// Prevent double handling if Lenis is actively firing
		if (window.lenis) return;

		if (!this.ticking) {
			window.requestAnimationFrame(() => {
				this.update(window.scrollY);
				this.ticking = false;
			});
			this.ticking = true;
		}
	}

	handleLenisScroll(e) {
		this.update(e.scroll);
	}

	update(currentScrollY) {
		const isScrolled = currentScrollY > 0;

		// Determine direction
		let isHidden = this.state.isHidden;

		if (currentScrollY > this.lastScrollY && currentScrollY > this.options.scrollThreshold) {
			// Scrolling down past threshold
			isHidden = true;
		} else if (currentScrollY < this.lastScrollY) {
			// Scrolling up
			isHidden = false;
		}

		this.lastScrollY = currentScrollY;

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

gia.register(StickyHeader);
