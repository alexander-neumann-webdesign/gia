class CountUp extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			start: 0,
			end: null, // parsed from element text if not provided
			duration: 2000, // milliseconds
			decimals: 0,
			separator: ",",
			decimal: ".",
			prefix: "",
			suffix: "",
			easing: true,
			useGrouping: true,
			threshold: 0.1,
			startOnMount: false, // bypass intersection observer
		};

		this.setState({
			isInview: false,
			isFinished: false,
		});

		this.startTime = null;
		this.frameId = null;
		this.currentValue = this.options.start;
		this.lastRendered = "";

		this.parseElementText();
	}

	parseElementText() {
		// If end value is strictly defined in options, respect it
		if (this.options.end !== null) return;

		const text = this.element.textContent.trim();

		// Match numbers with possible commas/decimals, and prefixes/suffixes
		// e.g. "$1,234.56+" -> Prefix: "$", Number: "1,234.56", Suffix: "+"
		const match = text.match(/^([^\d-]*)([-]?[\d.,]+)([^\d]*)$/);

		if (match) {
			if (!this.options.prefix && match[1]) this.options.prefix = match[1];
			if (!this.options.suffix && match[3]) this.options.suffix = match[3];

			const numStr = match[2].replace(/,/g, "");
			const decimalIndex = numStr.indexOf(".");
			if (decimalIndex > -1) {
				this.options.decimals = Math.max(this.options.decimals, numStr.length - decimalIndex - 1);
			}

			this.options.end = parseFloat(numStr);
		} else {
			this.options.end = parseFloat(text) || 100;
		}

		// Set initial layout value immediately to prevent FOUC (Flash of Unstyled Content)
		this.renderValue(this.options.start);
	}

	mount() {
		if (this.options.startOnMount) {
			this.setState({ isInview: true });
			this.startAnimation();
		} else {
			this.observeIntersection(this.element, this.handleIntersect, {
				threshold: this.options.threshold,
				rootMargin: "0px",
			});
		}
	}

	handleIntersect(entries) {
		// ⚡ BOLT OPTIMIZATION: Avoid Array.forEach closure allocations
		for (let i = 0; i < entries.length; i++) {
			if (entries[i].isIntersecting) {
				if (!this.state.isInview && !this.state.isFinished) {
					this.setState({ isInview: true });
					this.startAnimation();
				}
				// Clean up the observer immediately since this is a one-shot animation
				this.unobserveIntersection(this.element, this.handleIntersect);
			}
		}
	}

	startAnimation() {
		this.startTime = performance.now();
		if (!this.frameId) {
			this.frameId = requestAnimationFrame(this.tickUpdate);
		}
	}

	easeOutExpo(t) {
		return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
	}

	tickUpdate(timestamp) {
		// Normalize progress from 0 to 1
		let progress = (timestamp - this.startTime) / this.options.duration;
		if (progress > 1) progress = 1;

		const easedProgress = this.options.easing ? this.easeOutExpo(progress) : progress;

		this.currentValue = this.options.start + (this.options.end - this.options.start) * easedProgress;

		this.renderValue(this.currentValue);

		if (progress < 1) {
			this.frameId = requestAnimationFrame(this.tickUpdate);
		} else {
			this.frameId = null;
			this.setState({ isFinished: true });
		}
	}

	renderValue(value) {
		let formatted = value.toFixed(this.options.decimals);

		if (this.options.useGrouping) {
			const parts = formatted.split(".");
			// Fast regex for comma grouping
			parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.options.separator);
			formatted = parts.join(this.options.decimal);
		}

		const finalString = `${this.options.prefix}${formatted}${this.options.suffix}`;

		// ⚡ BOLT OPTIMIZATION: Only update DOM if text actually changed to prevent thrashing
		if (this.lastRendered !== finalString) {
			this.element.textContent = finalString;
			this.lastRendered = finalString;
		}
	}

	unmount() {
		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
		}
	}
}

gia.register(CountUp);

/*
========================================
EXPECTED HTML
========================================

<!-- Auto-parses value, suffix, and prefix from DOM! -->
<div data-component="CountUp">1,500+</div>

<!-- Manual options overriding via JSON -->
<div data-component="CountUp" data-options='{"duration": 3000, "start": 50, "end": 250.50, "decimals": 2, "prefix": "$"}'>
  $250.50
</div>

========================================
SUGGESTED SCSS
========================================

[data-component="CountUp"] {
  font-variant-numeric: tabular-nums; // Crucial: Prevents width jumping as digits cycle
  will-change: contents; 
}
*/
