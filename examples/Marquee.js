class Marquee extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			speed: 1, // Base scroll speed (pixels per frame)
			direction: "left", // 'left' or 'right'
			pauseOnHover: false,
			reactToScroll: false, // Whether to react to Lenis scroll events
		};

		this.ref = {
			track: null,
		};

		this.setState({
			isDragging: false,
			isHovered: false,
		});

		this.originalItems = [];
		this.clones = [];
		this.contentWidth = 0;
		this.containerWidth = 0;

		this.currentOffset = 0;
		this.ticking = false;

		// Respect prefers-reduced-motion
		this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

		this.preventDrag = this.preventDrag.bind(this);
	}

	mount() {
		if (!this.ref.track) return;

		// Prevent flexbox blowout
		this.element.style.minWidth = "0";
		this.element.style.maxWidth = "100%";

		// Prevent main thread hitches when marquee contains lazy images
		const images = this.element.querySelectorAll("img");
		for (let i = 0; i < images.length; i++) {
			images[i].setAttribute("decoding", "async");
		}

		// Force strict stacking context to prevent overlapping layers
		this.element.style.transform = "translateZ(0)";

		this.originalItems = [];
		const children = this.ref.track.children;
		for (let i = 0; i < children.length; i++) {
			this.originalItems.push(children[i]);
		}
		if (this.originalItems.length === 0) return;

		this.setupClones();

		this.baseSpeed = this.options.speed * (this.options.direction === "left" ? -1 : 1);

		// Observe resize to adjust clones and bounds
		this.observeResize(this.element, this.handleResize);

		// Play endlessly. Forcing it to never pause prevents the browser from
		// putting the GPU layer to sleep, which completely eliminates the startup
		// stutter/hitch when it wakes up on scroll.
		if (!this.prefersReducedMotion) {
			this.play();
		}
		this.bindScroll();

		this.initDrag();
		this.initHover();
	}

	unmount() {
		this.pause();
		if (this.frameId) {
			window.cancelAnimationFrame(this.frameId);
		}
		if (this.renderFrameId) {
			window.cancelAnimationFrame(this.renderFrameId);
		}
		this.unbindScroll();
		this.destroyHover();
		this.destroyDrag();
		clearTimeout(this._resizeTimer);
		this.unobserveResize(this.element, this.handleResize);
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
		if (!this.options.reactToScroll) return;
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
			this.element.addEventListener("mouseenter", this.onMouseEnter);
			this.element.addEventListener("mouseleave", this.onMouseLeave);
		}
	}

	destroyHover() {
		if (this.options.pauseOnHover) {
			this.element.removeEventListener("mouseenter", this.onMouseEnter);
			this.element.removeEventListener("mouseleave", this.onMouseLeave);
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
		if (e && typeof e.velocity === "number") {
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
		this.element.addEventListener("pointerdown", this.onPointerDown);

		// Prevent default drag behaviors on images and links within track
		this.ref.track.addEventListener("dragstart", this.preventDrag);
	}

	destroyDrag() {
		this.element.removeEventListener("pointerdown", this.onPointerDown);
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerUp);

		if (this.ref.track) {
			this.ref.track.removeEventListener("dragstart", this.preventDrag);
		}
	}

	preventDrag(e) {
		e.preventDefault();

		// Ensure native touch actions don't interfere with horizontal drag
		this.element.style.touchAction = "pan-y";
	}

	onPointerDown(e) {
		// Only handle primary button (left click) or touch
		if (e.button !== 0 && e.pointerType === "mouse") return;

		this.setState({ isDragging: true });
		this.lastDragX = e.clientX;
		this.lastDragTime = performance.now();
		this.dragVelocity = 0;

		window.addEventListener("pointermove", this.onPointerMove, { passive: true });
		window.addEventListener("pointerup", this.onPointerUp);
		window.addEventListener("pointercancel", this.onPointerUp);

		// Optional: add a grabbing cursor class
		this.element.style.cursor = "grabbing";
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
		this.element.style.cursor = "";

		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("pointerup", this.onPointerUp);
		window.removeEventListener("pointercancel", this.onPointerUp);

		const timeSinceLastMove = performance.now() - this.lastDragTime;
		if (timeSinceLastMove < 50) {
			this.scrollVelocity = this.dragVelocity;
		} else {
			this.scrollVelocity = 0;
		}
	}

	handleResize(entries) {
		const entry = entries[entries.length - 1];
		if (!entry || !entry.contentRect) return;

		// Prevent exponential growth by clamping width
		const newWidth = Math.min(entry.contentRect.width, window.innerWidth * 2);

		const isFirstRun = this.containerWidth === 0;

		// Prevent micro-pixel ResizeObserver loops
		if (!isFirstRun && Math.abs(this.containerWidth - newWidth) < 1) return;

		this.containerWidth = newWidth;

		clearTimeout(this._resizeTimer);

		if (isFirstRun) {
			this.updateBounds();
		} else {
			this._resizeTimer = setTimeout(() => {
				this.updateBounds();
			}, 150);
		}
	}

	updateBounds() {
		if (!this.originalWrapper) return;

		gia.mutate(() => {
			// Clear inline width before measuring to allow natural flex sizing
			this.originalWrapper.style.width = "";

			gia.measure(() => {
				this.contentWidth = Math.ceil(this.originalWrapper.getBoundingClientRect().width);

				if (this.contentWidth === 0) return;

				// We only need enough copies so that contentWidth * numCopies >= containerWidth + contentWidth
				const requiredCopies = Math.min(50, Math.ceil(this.containerWidth / this.contentWidth) + 1);

				gia.mutate(() => {
					this.originalWrapper.style.width = this.contentWidth + "px";

					// Ensure existing clones also update their width
					for (let i = 0; i < this.clones.length; i++) {
						this.clones[i].style.width = this.contentWidth + "px";
					}

					// Adjust the number of clones
					const currentTotalCopies = 1 + this.clones.length;

					if (requiredCopies > currentTotalCopies) {
						for (let i = currentTotalCopies; i < requiredCopies; i++) {
							// Use node.cloneNode(true) to cleanly copy the wrapper and its contents
							const cloneWrapper = this.originalWrapper.cloneNode(true);

							cloneWrapper.setAttribute("aria-hidden", "true");
							cloneWrapper.setAttribute("data-nosnippet", "");

							// Make inner items also hidden for safety
							const children = cloneWrapper.children;
							for (let j = 0; j < children.length; j++) {
								children[j].setAttribute("aria-hidden", "true");
								children[j].setAttribute("data-nosnippet", "");
							}

							this.clones.push(cloneWrapper);
							this.ref.track.appendChild(cloneWrapper);
						}
					}

					// Explicitly set the width of the track to prevent the browser from
					// continuously recalculating the bounding box of the flex container on every frame
					this.ref.track.style.width = this.contentWidth * (1 + this.clones.length) + "px";
				});
			});
		});
	}

	tick(time) {
		if (!this.ticking) return;

		// Calculate delta time for consistent speed across refresh rates (e.g., 60hz vs 144hz)
		// Normalize against a standard 60fps frame (~16.67ms)
		// Added Math.max(0) to prevent negative dt bugs when mixing performance.now() and rAF timestamps
		const dt = Math.max(0, time - this.lastTime);
		this.lastTime = time;

		const timeScale = Math.min(dt / 16.67, 2); // Cap at 2 to prevent huge jumps on lag spikes

		let frameOffset = 0;

		const isPaused = this.state.isDragging || (this.options.pauseOnHover && this.state.isHovered);
		const targetMultiplier = isPaused ? 0 : 1;

		// Only compute expensive Math.pow if we are actively accelerating/decelerating or if there is scroll velocity
		const hasScrollVelocity = Math.abs(this.scrollVelocity) > 0.01;
		const needsSpeedAdjustment = Math.abs(targetMultiplier - this.speedMultiplier) >= 0.001;

		if (needsSpeedAdjustment || hasScrollVelocity) {
			const decayMath = Math.pow(0.9, timeScale);

			if (needsSpeedAdjustment) {
				this.speedMultiplier += (targetMultiplier - this.speedMultiplier) * (1 - decayMath);
				if (Math.abs(targetMultiplier - this.speedMultiplier) < 0.001) {
					this.speedMultiplier = targetMultiplier;
				}
			}

			if (hasScrollVelocity) {
				frameOffset += this.scrollVelocity * timeScale;
				// Decay the scroll velocity (friction) using frame-rate independent exponential smoothing
				this.scrollVelocity *= decayMath;
			}
		} else {
			this.speedMultiplier = targetMultiplier;
			this.scrollVelocity = 0;
		}

		frameOffset += this.baseSpeed * this.speedMultiplier * timeScale;

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
		// Round to the nearest whole pixel to completely prevent 'Layerize' CPU spikes
		// caused by sub-pixel font anti-aliasing re-rasterization in Chromium.
		// Since currentOffset is always negative, (offset - 0.5) | 0 acts as a hyper-fast Math.round()
		const roundedOffset = (this.currentOffset - 0.5) | 0;
		if (this._lastRoundedOffset !== roundedOffset) {
			this._lastRoundedOffset = roundedOffset;
			// String concatenation is faster than template literals in V8 hot loops
			this.ref.track.style.transform = 'translate3d(' + roundedOffset + 'px, 0, 0)';
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

		const originalWrapper = document.createElement("div");
		originalWrapper.style.display = "flex"; // Ensure it's inline
		originalWrapper.style.flexShrink = "0"; // Prevent shrinking

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
  position: relative;
  width: 100%;
  display: flex;
  overflow: hidden;
  contain: layout paint style;
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
