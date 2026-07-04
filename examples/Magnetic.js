class Magnetic extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			strength: 0.6, // How much the element moves relative to the mouse (0.5 = 50%)
			textStrength: 0.075, // Move a child text element even further for a 3D parallax effect
			lerp: 0.1, // Smoothing interpolation when hovered (0.01 to 1)
			spring: 0.1, // Spring stiffness when snapping back (lower = looser spring)
			friction: 0.5, // Spring damping when snapping back (0 to 1, lower = more bounce)
		};

		this.ref = {
			element: null, // The actual physical button/element to move
			text: null, // Inner text for parallax (optional)
		};

		this.mouse = { x: 0, y: 0 };
		this.target = { x: 0, y: 0 };
		this.current = { x: 0, y: 0 };
		this.velocity = { x: 0, y: 0 };

		this.textTarget = { x: 0, y: 0 };
		this.textCurrent = { x: 0, y: 0 };
		this.textVelocity = { x: 0, y: 0 };

		this.boundingRect = { width: 0, height: 0, left: 0, top: 0 };

		this.frameId = null;

		this.setState({
			isHovered: false,
		});
	}

	mount() {
		if (!this.ref.element) {
			console.warn(`Magnetic: No data-ref="element" found.`);
			return;
		}

		// Use pointer events for mouse and touch unification
		// We attach listeners to `this.element` (the wrapper) which acts as the stable bounding area.
		// If we attached to this.ref.element, the bounding rect would drift as the element moves!
		this.element.addEventListener("pointerenter", this.handlePointerEnter);
		this.element.addEventListener("pointermove", this.handlePointerMove);
		this.element.addEventListener("pointerleave", this.handlePointerLeave);

		// Update bounds if the window resizes
		this.observeResize(this.element, this.updateBounds);
	}

	unmount() {
		this.element.removeEventListener("pointerenter", this.handlePointerEnter);
		this.element.removeEventListener("pointermove", this.handlePointerMove);
		this.element.removeEventListener("pointerleave", this.handlePointerLeave);

		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
		}
	}

	updateBounds() {
		// Since this.element is NEVER transformed, getting its rect is always accurate
		const rect = this.element.getBoundingClientRect();
		// We MUST use viewport-relative coordinates (rect.top/left and clientX/Y)
		// rather than document-relative (pageY). If we used pageY, position:fixed elements
		// (like sticky header buttons) would have their distance math explode when scrolled!
		this.boundingRect = {
			width: rect.width,
			height: rect.height,
			left: rect.left,
			top: rect.top,
		};
	}

	handlePointerEnter(e) {
		// Ignore on touch devices where "hovering" physics don't translate well
		if (e.pointerType === "touch") return;

		this.setState({ isHovered: true });
		this.updateBounds(); // Always get fresh bounds on enter

		if (!this.frameId) {
			this.frameId = requestAnimationFrame(this.tickUpdate);
		}
	}

	handlePointerMove(e) {
		if (!this.state.isHovered) return;

		// Use clientX/Y to match the viewport-relative bounding rect cache
		this.mouse.x = e.clientX;
		this.mouse.y = e.clientY;

		const centerX = this.boundingRect.left + this.boundingRect.width / 2;
		const centerY = this.boundingRect.top + this.boundingRect.height / 2;

		const distX = this.mouse.x - centerX;
		const distY = this.mouse.y - centerY;

		this.target.x = distX * this.options.strength;
		this.target.y = distY * this.options.strength;

		if (this.ref.text) {
			this.textTarget.x = distX * this.options.textStrength;
			this.textTarget.y = distY * this.options.textStrength;
		}
	}

	handlePointerLeave(e) {
		this.setState({ isHovered: false });

		// Target returns to origin
		this.target.x = 0;
		this.target.y = 0;
		this.textTarget.x = 0;
		this.textTarget.y = 0;
	}

	tickUpdate() {
		// ⚡ BOLT OPTIMIZATION: Zero closure allocations in hot physics loop
		const { isHovered } = this.state;

		if (isHovered) {
			// Calculate velocity during lerp so the spring inherits momentum on leave
			const prevX = this.current.x;
			const prevY = this.current.y;

			this.current.x += (this.target.x - this.current.x) * this.options.lerp;
			this.current.y += (this.target.y - this.current.y) * this.options.lerp;

			this.velocity.x = this.current.x - prevX;
			this.velocity.y = this.current.y - prevY;

			if (this.ref.text) {
				const prevTextX = this.textCurrent.x;
				const prevTextY = this.textCurrent.y;

				this.textCurrent.x += (this.textTarget.x - this.textCurrent.x) * this.options.lerp;
				this.textCurrent.y += (this.textTarget.y - this.textCurrent.y) * this.options.lerp;

				this.textVelocity.x = this.textCurrent.x - prevTextX;
				this.textVelocity.y = this.textCurrent.y - prevTextY;
			}
		} else {
			// Spring physics when snapping back
			this.velocity.x += (this.target.x - this.current.x) * this.options.spring;
			this.velocity.y += (this.target.y - this.current.y) * this.options.spring;
			this.velocity.x *= this.options.friction;
			this.velocity.y *= this.options.friction;

			this.current.x += this.velocity.x;
			this.current.y += this.velocity.y;

			if (this.ref.text) {
				this.textVelocity.x += (this.textTarget.x - this.textCurrent.x) * this.options.spring;
				this.textVelocity.y += (this.textTarget.y - this.textCurrent.y) * this.options.spring;
				this.textVelocity.x *= this.options.friction;
				this.textVelocity.y *= this.options.friction;

				this.textCurrent.x += this.textVelocity.x;
				this.textCurrent.y += this.textVelocity.y;
			}
		}

		// Calculate total energy to know when to stop
		const distSq = (this.target.x - this.current.x) ** 2 + (this.target.y - this.current.y) ** 2;
		const velSq = this.velocity.x ** 2 + this.velocity.y ** 2;
		const energy = distSq + velSq;

		this.renderPosition();

		// Check if we can stop ticking (not hovered and energy is near zero)
		if (!isHovered && energy < 0.05) {
			// Snap to exact 0 to clean up floating point errors
			this.current.x = 0;
			this.current.y = 0;
			this.velocity.x = 0;
			this.velocity.y = 0;

			if (this.ref.text) {
				this.textCurrent.x = 0;
				this.textCurrent.y = 0;
				this.textVelocity.x = 0;
				this.textVelocity.y = 0;
			}
			this.renderPosition();
			this.frameId = null; // Stop RAF loop
		} else {
			this.frameId = requestAnimationFrame(this.tickUpdate);
		}
	}

	renderPosition() {
		if (!this.ref.element) return;

		// Rounding to 3 decimals prevents micro-layout shifts
		const roundedX = Math.round(this.current.x * 1000) / 1000;
		const roundedY = Math.round(this.current.y * 1000) / 1000;
		const transformStr = `translate3d(${roundedX}px, ${roundedY}px, 0)`;

		// String caching to prevent DOM writes if the transform hasn't changed
		if (this._lastTransform !== transformStr) {
			this.ref.element.style.transform = transformStr;
			this._lastTransform = transformStr;
		}

		if (this.ref.text) {
			const roundedTextX = Math.round(this.textCurrent.x * 1000) / 1000;
			const roundedTextY = Math.round(this.textCurrent.y * 1000) / 1000;
			const textTransformStr = `translate3d(${roundedTextX}px, ${roundedTextY}px, 0)`;

			if (this._lastTextTransform !== textTransformStr) {
				this.ref.text.style.transform = textTransformStr;
				this._lastTextTransform = textTransformStr;
			}
		}
	}
}

gia.register(Magnetic);

/*
========================================
EXPECTED HTML
========================================

<!-- Basic Usage -->
<div class="magnetic-wrap" data-component="Magnetic">
  <button data-ref="element" class="magnetic-element">Hover Me!</button>
</div>

<!-- Advanced Parallax Usage -->
<div class="magnetic-wrap" data-component="Magnetic" data-options='{"strength": 0.6, "textStrength": 0.25}'>
  <button data-ref="element" class="magnetic-element">
	<span data-ref="text" class="magnetic-text">Parallax Hover</span>
  </button>
</div>

========================================
SUGGESTED SCSS
========================================

// The wrapper must define the hit-area. Making it inline-block ensures
// it hugs the button perfectly, but you can also add padding to it to
// increase the magnetic "reach" radius.
.magnetic-wrap {
  display: inline-block;
  padding: 1rem; // Optional: increases hover trigger area
  cursor: pointer;

  .magnetic-element {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 2rem;
    border-radius: 9999px;
    background: #000;
    color: #fff;
    will-change: transform;
	
    // Remove transition so JS controls it natively via lerp
    transition: background-color 0.3s ease; 
  }

  .magnetic-text {
    display: inline-block;
    will-change: transform;
    pointer-events: none; // Prevent text from interfering with hover
  }
}
*/
