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
		Reveal.observe(this.element, this);
	}

	unmount() {
		Reveal.unobserve(this.element, this);
	}

	handleIntersect(entries) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				this.setState({ isInview: true });

				if (this.options.once) {
					Reveal.unobserve(this.element, this);
				}
			} else if (!this.options.once) {
				this.setState({ isInview: false });
			}
		});
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

Reveal.instances = new WeakMap();
Reveal.observers = new Map();

Reveal.getObserver = function(options) {
	const key = JSON.stringify({ threshold: options.threshold, rootMargin: options.rootMargin });

	if (!Reveal.observers.has(key)) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				const instance = Reveal.instances.get(entry.target);
				if (instance) {
					instance.handleIntersect([entry]);
				}
			});
		}, {
			threshold: options.threshold,
			rootMargin: options.rootMargin
		});
		Reveal.observers.set(key, observer);
	}

	return Reveal.observers.get(key);
};

Reveal.observe = function(element, instance) {
	Reveal.instances.set(element, instance);
	const observer = Reveal.getObserver(instance.options);
	observer.observe(element);
};

Reveal.unobserve = function(element, instance) {
	const observer = Reveal.getObserver(instance.options);
	observer.unobserve(element);
	Reveal.instances.delete(element);
};

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
