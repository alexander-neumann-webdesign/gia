class Magnetic extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			strength: 0.5, // How much the element moves relative to the mouse (0.5 = 50%)
			textStrength: 0.2, // Move a child text element even further for a 3D parallax effect
			lerp: 0.1, // Smoothing interpolation (0.01 to 1)
		};

		this.ref = {
			element: null, // The actual physical button/element to move
			text: null     // Inner text for parallax (optional)
		};

		this.mouse = { x: 0, y: 0 };
		this.target = { x: 0, y: 0 };
		this.current = { x: 0, y: 0 };

		this.textTarget = { x: 0, y: 0 };
		this.textCurrent = { x: 0, y: 0 };

		this.boundingRect = { width: 0, height: 0, left: 0, top: 0 };
		
		this.frameId = null;

		this.setState({
			isHovered: false
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
		this.element.addEventListener('pointerenter', this.handlePointerEnter);
		this.element.addEventListener('pointermove', this.handlePointerMove);
		this.element.addEventListener('pointerleave', this.handlePointerLeave);
		
		// Update bounds if the window resizes
		this.observeResize(this.element, this.updateBounds);
	}

	unmount() {
		this.element.removeEventListener('pointerenter', this.handlePointerEnter);
		this.element.removeEventListener('pointermove', this.handlePointerMove);
		this.element.removeEventListener('pointerleave', this.handlePointerLeave);

		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
		}
	}

	updateBounds() {
		// Since this.element is NEVER transformed, getting its rect is always accurate
		const rect = this.element.getBoundingClientRect();
		this.boundingRect = {
			width: rect.width,
			height: rect.height,
			left: rect.left,
			top: rect.top
		};
	}

	handlePointerEnter(e) {
		// Ignore on touch devices where "hovering" physics don't translate well
		if (e.pointerType === 'touch') return; 
		
		this.setState({ isHovered: true });
		this.updateBounds(); // Always get fresh bounds on enter

		if (!this.frameId) {
			this.frameId = requestAnimationFrame(this.tickUpdate);
		}
	}

	handlePointerMove(e) {
		if (!this.state.isHovered) return;

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
		this.current.x += (this.target.x - this.current.x) * this.options.lerp;
		this.current.y += (this.target.y - this.current.y) * this.options.lerp;

		if (this.ref.text) {
			this.textCurrent.x += (this.textTarget.x - this.textCurrent.x) * this.options.lerp;
			this.textCurrent.y += (this.textTarget.y - this.textCurrent.y) * this.options.lerp;
		}

		const dx = this.target.x - this.current.x;
		const dy = this.target.y - this.current.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		this.renderPosition();

		// Check if we can stop ticking (not hovered and returned to origin)
		if (!this.state.isHovered && dist < 0.1) {
			// Snap to exact 0 to clean up floating point errors
			this.current.x = 0;
			this.current.y = 0;
			if (this.ref.text) {
				this.textCurrent.x = 0;
				this.textCurrent.y = 0;
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
