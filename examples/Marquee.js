class Marquee extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			speed: 1, // Base scroll speed (pixels per frame)
			direction: 'left', // 'left' or 'right'
			pauseOnHover: false
		};

		this.ref = {
			track: null
		};

		this.setState({
			isDragging: false,
			isHovered: false
		});

		this.originalItems = [];
		this.clones = [];
		this.contentWidth = 0;
		this.containerWidth = 0;

		this.currentOffset = 0;
		this.ticking = false;

		// Respect prefers-reduced-motion
		this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Drag state
		this.lastDragX = 0;

		// Scroll acceleration state
		this.scrollVelocity = 0;
		this.dragVelocity = 0;
		this.lastDragTime = 0;
		this.lastScrollY = window.scrollY || window.pageYOffset;
		this.isScrollBound = false;

		// RAF timing
		this.lastTime = 0;

		// Smooth deceleration multiplier
		this.speedMultiplier = 1;

		this._isRenderingFrame = false;

		this.handleIntersection = this.handleIntersection.bind(this);
		this.preventDrag = this.preventDrag.bind(this);
	}

	mount() {
		if (!this.ref.track) return;

		this.originalItems = [];
		const children = this.ref.track.children;
		for (let i = 0; i < children.length; i++) {
			this.originalItems.push(children[i]);
		}
		if (this.originalItems.length === 0) return;

		this.setupClones();

		// Observe resize to adjust clones and bounds
		this.observeResize(this.element, this.handleResize);

		// Start autoplay loop when in viewport
		this.observeIntersection(this.element, this.handleIntersection);

		this.initDrag();
		this.bindScroll();
		this.initHover();
	}

	unmount() {
		this.pause();
		this.unbindScroll();
		this.destroyHover();
		this.destroyDrag();

		if (this.frameId) {
			window.cancelAnimationFrame(this.frameId);
		}
		if (this.renderFrameId) {
			window.cancelAnimationFrame(this.renderFrameId);
		}
	}

	handleIntersection(entries) {
		const entry = entries[entries.length - 1];
		if (entry.isIntersecting) {
			if (!this.prefersReducedMotion) {
				this.play();
			}
		} else {
			this.pause();
		}
	}

	play() {
		if (!this.ticking) {
			this.ticking = true;
			this.lastTime = performance.now();
			this.tick(this.lastTime);
		}
	}

	pause() {
		this.ticking = false;
	}

	bindScroll() {
		if (this.isScrollBound) return;

		// Only bind scroll if lenis is active
		if (window.lenis) {
			this.isScrollBound = true;
			this.observeScroll(this.handleScroll);
		}
	}

	unbindScroll() {
		if (!this.isScrollBound) return;

		if (window.lenis) {
			this.unobserveScroll(this.handleScroll);
			this.isScrollBound = false;
		}
	}

	initHover() {
		if (this.options.pauseOnHover) {
			this.element.addEventListener('mouseenter', this.onMouseEnter);
			this.element.addEventListener('mouseleave', this.onMouseLeave);
		}
	}

	destroyHover() {
		if (this.options.pauseOnHover) {
			this.element.removeEventListener('mouseenter', this.onMouseEnter);
			this.element.removeEventListener('mouseleave', this.onMouseLeave);
		}
	}

	onMouseEnter() {
		this.setState({ isHovered: true });
	}

	onMouseLeave() {
		this.setState({ isHovered: false });
	}

	handleScroll(e) {
		if (!window.lenis) return;

		// Lenis provides e.velocity directly
		if (e && typeof e.velocity === 'number') {
			// Multiply by a factor to control sensitivity
			this.scrollVelocity = e.velocity * 0.5;

			// If motion is disabled, we might need to manually call renderPosition if tick is paused
			if (!this.ticking) {
				this.currentOffset += this.scrollVelocity;
				if (!this._isRenderingFrame) {
					this._isRenderingFrame = true;
					this.renderFrameId = window.requestAnimationFrame(this.renderFrame);
				}
			}
		}
	}

	initDrag() {
		this.element.addEventListener('pointerdown', this.onPointerDown);

		// Prevent default drag behaviors on images and links within track
		this.ref.track.addEventListener('dragstart', this.preventDrag);
	}

	destroyDrag() {
		this.element.removeEventListener('pointerdown', this.onPointerDown);
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerup', this.onPointerUp);
		window.removeEventListener('pointercancel', this.onPointerUp);

		if (this.ref.track) {
			this.ref.track.removeEventListener('dragstart', this.preventDrag);
		}
	}

	preventDrag(e) {
		e.preventDefault();

		// Ensure native touch actions don't interfere with horizontal drag
		this.element.style.touchAction = 'pan-y';
	}

	onPointerDown(e) {
		// Only handle primary button (left click) or touch
		if (e.button !== 0 && e.pointerType === 'mouse') return;

		this.setState({ isDragging: true });
		this.lastDragX = e.clientX;
		this.lastDragTime = performance.now();
		this.dragVelocity = 0;

		window.addEventListener('pointermove', this.onPointerMove, { passive: true });
		window.addEventListener('pointerup', this.onPointerUp);
		window.addEventListener('pointercancel', this.onPointerUp);

		// Optional: add a grabbing cursor class
		this.element.style.cursor = 'grabbing';
	}

	onPointerMove(e) {
		if (!this.state.isDragging) return;

		const deltaX = e.clientX - this.lastDragX;
		const now = performance.now();
		const dt = Math.max(now - this.lastDragTime, 1);

		this.dragVelocity = deltaX / (dt / 16.67);

		this.currentOffset += deltaX;
		this.lastDragX = e.clientX;
		this.lastDragTime = now;

		// We handle rendering directly here or in the tick loop.
		// If motion is disabled, we might need to manually call renderPosition if tick is paused
		if (!this.ticking) {
			if (!this._isRenderingFrame) {
				this._isRenderingFrame = true;
				this.renderFrameId = window.requestAnimationFrame(this.renderFrame);
			}
		}
	}

	onPointerUp(e) {
		if (!this.state.isDragging) return;

		this.setState({ isDragging: false });
		this.element.style.cursor = '';

		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerup', this.onPointerUp);
		window.removeEventListener('pointercancel', this.onPointerUp);

		const timeSinceLastMove = performance.now() - this.lastDragTime;
		if (timeSinceLastMove < 50) {
			this.scrollVelocity = this.dragVelocity;
		} else {
			this.scrollVelocity = 0;
		}
	}

	handleResize(entries) {
		const entry = entries[entries.length - 1];
		this.containerWidth = entry.contentRect.width;
		this.updateBounds();
	}

	updateBounds() {
		// Measure content
		if (this.originalWrapper) {
			// Round the width up to ensure the layout wrapper forces integer bounds,
			// preventing sub-pixel misalignment stutters on wrap boundaries.
			// Clear inline width before measuring to allow natural flex sizing
			this.originalWrapper.style.width = '';
			this.contentWidth = Math.ceil(this.originalWrapper.getBoundingClientRect().width);
			this.originalWrapper.style.width = this.contentWidth + 'px';

			// Ensure existing clones also update their width
			for (let i = 0; i < this.clones.length; i++) {
				this.clones[i].style.width = this.contentWidth + 'px';
			}
		}

		if (this.contentWidth === 0) return;

		// We need enough copies so that contentWidth * numCopies > containerWidth * 2
		// to allow safe scrolling and dragging in both directions without gaps.
		const requiredCopies = Math.max(2, Math.ceil((this.containerWidth * 2) / this.contentWidth));

		// Adjust the number of clones
		const currentTotalCopies = 1 + this.clones.length;

		if (requiredCopies > currentTotalCopies) {
			for (let i = currentTotalCopies; i < requiredCopies; i++) {
				// Use node.cloneNode(true) to cleanly copy the wrapper and its contents
				const cloneWrapper = this.originalWrapper.cloneNode(true);

				cloneWrapper.setAttribute('aria-hidden', 'true');
				cloneWrapper.setAttribute('data-nosnippet', '');

				// Make inner items also hidden for safety
				const children = cloneWrapper.children;
				for (let j = 0; j < children.length; j++) {
					children[j].setAttribute('aria-hidden', 'true');
					children[j].setAttribute('data-nosnippet', '');
				}

				this.clones.push(cloneWrapper);
				this.ref.track.appendChild(cloneWrapper);
			}
		}
	}

	tick(time) {
		if (!this.ticking) return;

		// Calculate delta time for consistent speed across refresh rates (e.g., 60hz vs 144hz)
		// Normalize against a standard 60fps frame (~16.67ms)
		const dt = time - this.lastTime;
		this.lastTime = time;

		const timeScale = Math.min(dt / 16.67, 2); // Cap at 2 to prevent huge jumps on lag spikes

		let frameOffset = 0;

		const isPaused = this.state.isDragging || (this.options.pauseOnHover && this.state.isHovered);
		const targetMultiplier = isPaused ? 0 : 1;

		const decayMath = Math.pow(0.9, timeScale);

		this.speedMultiplier += (targetMultiplier - this.speedMultiplier) * (1 - decayMath);

		if (Math.abs(targetMultiplier - this.speedMultiplier) < 0.001) {
			this.speedMultiplier = targetMultiplier;
		}

		const directionMultiplier = this.options.direction === 'left' ? -1 : 1;
		frameOffset += (this.options.speed * directionMultiplier) * this.speedMultiplier * timeScale;

		// Apply scroll velocity if any
		if (Math.abs(this.scrollVelocity) > 0.01) {
			frameOffset += this.scrollVelocity * timeScale;
			// Decay the scroll velocity (friction) using frame-rate independent exponential smoothing
			this.scrollVelocity *= decayMath;
		} else {
			this.scrollVelocity = 0;
		}

		this.currentOffset += frameOffset;

		this.renderPosition();

		this.frameId = window.requestAnimationFrame(this.tick);
	}

	renderFrame() {
		this.renderPosition();
		this._isRenderingFrame = false;
	}

	renderPosition() {
		if (this.contentWidth === 0) return;

		// Seamless wrap logic using modulo to handle large jumps
		// JS modulo operator can return negative values, so we apply the formula:
		// ((value % max) + max) % max

		// Because we move it to the left mostly, we want the offset to be in [-contentWidth, 0)
		let offset = this.currentOffset;

		offset = ((offset % this.contentWidth) - this.contentWidth) % this.contentWidth;

		if (offset === -this.contentWidth) offset = 0; // Prevent edge case jump

		this.currentOffset = offset;

		// Apply transform to the track
		const roundedOffset = Math.round(this.currentOffset * 10000) / 10000;
		const transformStr = `translate3d(${roundedOffset}px, 0, 0)`;
		if (this._lastTransform !== transformStr) {
			this.ref.track.style.transform = transformStr;
			this._lastTransform = transformStr;
		}
	}

	setupClones() {
		// Clean up existing clones if any
		for (let i = 0; i < this.clones.length; i++) {
			this.clones[i].remove();
		}
		this.clones = [];

		// We need to calculate how many clones are needed.
		// Create a single container wrapper for the original items to easily measure its full width.
		// Append original items into this wrapper instead of using outerHTML to preserve event listeners/refs.

		this.ref.track.replaceChildren();

		const originalWrapper = document.createElement('div');
		originalWrapper.style.display = 'flex'; // Ensure it's inline
		originalWrapper.style.flexShrink = '0'; // Prevent shrinking

		for (let i = 0; i < this.originalItems.length; i++) {
			originalWrapper.appendChild(this.originalItems[i]);
		}

		this.ref.track.appendChild(originalWrapper);
		this.originalWrapper = originalWrapper;
	}
}

gia.register(Marquee);

/*
========================================
EXPECTED HTML
========================================

<div data-component="Marquee" data-options='{"speed": 1.5, "direction": "left", "pauseOnHover": true}'>
  <div data-ref="track" class="marquee-track">
    <div class="marquee-item">Item 1</div>
    <div class="marquee-item">Item 2</div>
    <div class="marquee-item">Item 3</div>
  </div>
</div>

========================================
SUGGESTED SCSS
========================================

div[data-component="Marquee"] {
  overflow: hidden;
  position: relative;
  width: 100%;
  display: flex;
  user-select: none;
  touch-action: pan-y;

  &.masked {
    mask: linear-gradient(90deg, transparent, #000 10% 90%, transparent);
  }

  .marquee-track {
    display: flex;
    flex-wrap: nowrap;
    will-change: transform;
  }

  .marquee-item {
    flex-shrink: 0;
    padding: 0 2rem;
  }
}
*/
