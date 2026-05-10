class Reveal extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			threshold: 0.1,    // Percentage of element that must be visible (0 to 1)
			rootMargin: "0px", // Margin around the root. Can have values similar to the CSS margin property
			once: true,        // Whether to only trigger the reveal once
			inviewClass: "is-inview"
		};

		this.setState({
			isInview: false
		});
	}

	mount() {
		this.observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						this.setState({ isInview: true });

						if (this.options.once) {
							this.observer.unobserve(this.element);
						}
					} else if (!this.options.once) {
						this.setState({ isInview: false });
					}
				});
			},
			{
				threshold: this.options.threshold,
				rootMargin: this.options.rootMargin
			}
		);

		this.observer.observe(this.element);
	}

	unmount() {
		if (this.observer) {
			this.observer.disconnect();
		}
	}

	stateChange(stateChanges) {
		if ('isInview' in stateChanges) {
			if (this.state.isInview) {
				this.element.classList.add(this.options.inviewClass);
			} else {
				this.element.classList.remove(this.options.inviewClass);
			}
		}
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
 *   &.is-inview {
 *     opacity: 1;
 *     transform: translateY(0);
 *   }
 * }
 */
