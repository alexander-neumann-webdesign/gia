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
 * <div data-component="Reveal" data-options='{"threshold": 0.2, "once": true}'>
 *   <h2>Fade me in</h2>
 *   <p>When I scroll into view.</p>
 * </div>
 *
 * Suggested SCSS:
 *
 * [data-component="Reveal"] {
 *   opacity: 0;
 *   transform: translateY(30px);
 *   transition: opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1), transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
 *   will-change: opacity, transform;
 *
 *   &[data-is-inview="true"] {
 *     opacity: 1;
 *     transform: translateY(0);
 *   }
 * }
 */
