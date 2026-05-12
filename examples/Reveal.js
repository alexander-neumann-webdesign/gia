class Reveal extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			threshold: 0.1,    // Percentage of element that must be visible (0 to 1)
			rootMargin: "0px", // Margin around the root. Can have values similar to the CSS margin property
			once: true,        // Whether to only trigger the reveal once
		};

		this.setState({
			isInview: false
		});
	}

	mount() {
		this.observeIntersection(this.element, this.handleIntersect, {
			threshold: this.options.threshold,
			rootMargin: this.options.rootMargin
		});
	}

	handleIntersect(entries) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				this.setState({ isInview: true });

				if (this.options.once) {
					this.unobserveIntersection(this.element, this.handleIntersect);
				}
			} else if (!this.options.once) {
				this.setState({ isInview: false });
			}
		});
	}

	unmount() {
	}

	stateChange(stateChanges) {
		// Classes are now automatically mapped to data-is-inview by BaseComponent
	}
}

gia.register(Reveal);

/**
 * Expected HTML Structure:
 *
 * <noscript>
 *   <style>
 *     [data-component="Reveal"] {
 *       opacity: 1 !important;
 *       visibility: visible !important;
 *       transform: translateY(0) !important;
 *     }
 *   </style>
 * </noscript>
 *
 * <div data-component="Reveal" data-options='{"threshold": 0.2, "once": true}'>
 *   <h2>Fade me in</h2>
 *   <p>When I scroll into view.</p>
 * </div>
 *
 * Suggested SCSS:
 *
 * [data-component="Reveal"] {
 *   opacity: 0;
 *   visibility: hidden;
 *   transform: translateY(30px);
 *   transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), visibility 0s 0.8s;
 *   will-change: opacity, transform, visibility;
 *
 *   &[data-is-inview="true"] {
 *     opacity: 1;
 *     visibility: visible;
 *     transform: translateY(0);
 *     transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), visibility 0s 0s;
 *   }
 * }
 */
