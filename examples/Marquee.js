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

		this.state = {
			isDragging: false,
			isHovered: false
		};

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
	}

	mount() {
		if (!this.ref.track) return;

		this.originalItems = Array.from(this.ref.track.children);
		if (this.originalItems.length === 0) return;

		this.setupClones();

		// Observe resize to adjust clones and bounds
		this.observeResize(this.element, this.handleResize);

		// Start autoplay loop when in viewport
		this.observeIntersection(this.element, ([entry]) => {
			if (entry.isIntersecting) {
				if (!this.prefersReducedMotion) {
					this.play();
				}
			} else {
				this.pause();
			}
		});

		this.initDrag();
		this.bindScroll();
		this.initHover();
	}

	unmount() {
		this.pause();
		this.unbindScroll();
		this.destroyHover();
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
			window.lenis.on('scroll', this.handleScroll);
		}
	}

	unbindScroll() {
		if (!this.isScrollBound) return;

		if (window.lenis) {
			window.lenis.off('scroll', this.handleScroll);
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
					window.requestAnimationFrame(this.renderFrame);
				}
			}
		}
	}

	initDrag() {
		this.element.addEventListener('pointerdown', this.onPointerDown);
		window.addEventListener('pointermove', this.onPointerMove, { passive: false });
		window.addEventListener('pointerup', this.onPointerUp);
		window.addEventListener('pointercancel', this.onPointerUp);

		// Prevent default drag behaviors on images and links within track
		this.ref.track.addEventListener('dragstart', (e) => e.preventDefault());
	}

	onPointerDown(e) {
		// Only handle primary button (left click) or touch
		if (e.button !== 0 && e.pointerType === 'mouse') return;

		this.setState({ isDragging: true });
		this.lastDragX = e.clientX;
		this.lastDragTime = performance.now();
		this.dragVelocity = 0;

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
				window.requestAnimationFrame(this.renderFrame);
			}
		}
	}

	onPointerUp(e) {
		if (!this.state.isDragging) return;

		this.setState({ isDragging: false });
		this.element.style.cursor = '';

		const timeSinceLastMove = performance.now() - this.lastDragTime;
		if (timeSinceLastMove < 50) {
			this.scrollVelocity = this.dragVelocity;
		} else {
			this.scrollVelocity = 0;
		}
	}

	handleResize([entry]) {
		this.containerWidth = entry.contentRect.width;

		// Measure content
		if (this.originalWrapper) {
			this.contentWidth = this.originalWrapper.getBoundingClientRect().width;
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
				Array.from(cloneWrapper.children).forEach(child => {
					child.setAttribute('aria-hidden', 'true');
					child.setAttribute('data-nosnippet', '');
				});

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

		this.speedMultiplier += (targetMultiplier - this.speedMultiplier) * (1 - Math.pow(0.9, timeScale));

		if (Math.abs(targetMultiplier - this.speedMultiplier) < 0.001) {
			this.speedMultiplier = targetMultiplier;
		}

		const directionMultiplier = this.options.direction === 'left' ? -1 : 1;
		frameOffset += (this.options.speed * directionMultiplier) * this.speedMultiplier * timeScale;

		// Apply scroll velocity if any
		if (Math.abs(this.scrollVelocity) > 0.01) {
			frameOffset += this.scrollVelocity * timeScale;
			// Decay the scroll velocity (friction) using frame-rate independent exponential smoothing
			this.scrollVelocity *= Math.pow(0.9, timeScale);
		} else {
			this.scrollVelocity = 0;
		}

		this.currentOffset += frameOffset;

		this.renderPosition();

		window.requestAnimationFrame(this.tick);
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

		const transform = `translate3d(${this.currentOffset}px, 0, 0)`;
		if (this._lastTransform !== transform) {
			this._lastTransform = transform;
			// Apply transform to the track
			this.ref.track.style.transform = transform;
		}
	}

	setupClones() {
		// Clean up existing clones if any
		this.clones.forEach(clone => clone.remove());
		this.clones = [];

		// We need to calculate how many clones are needed.
		// Create a single container wrapper for the original items to easily measure its full width.
		// Append original items into this wrapper instead of using outerHTML to preserve event listeners/refs.

		this.ref.track.innerHTML = '';

		const originalWrapper = document.createElement('div');
		originalWrapper.style.display = 'flex'; // Ensure it's inline
		originalWrapper.style.flexShrink = '0'; // Prevent shrinking

		this.originalItems.forEach(item => {
			originalWrapper.appendChild(item);
		});

		this.ref.track.appendChild(originalWrapper);
		this.originalWrapper = originalWrapper;
	}
}

gia.register(Marquee);

/**
 * Expected HTML Structure:
 *
 * <div data-component="Marquee" data-options='{"speed": 1.5, "direction": "left", "pauseOnHover": true}'>
 *   <div data-ref="track" class="marquee-track">
 *     <div class="marquee-item">Item 1</div>
 *     <div class="marquee-item">Item 2</div>
 *     <div class="marquee-item">Item 3</div>
 *   </div>
 * </div>
 *
 * Suggested SCSS:
 *
 * div[data-component="Marquee"] {
 *   overflow: hidden;
 *   position: relative;
 *   width: 100%;
 *   display: flex;
 *   user-select: none;
 *
 *   &.masked {
 *     mask: linear-gradient(90deg, transparent, #000 10% 90%, transparent);
 *   }
 *
 *   .marquee-track {
 *     display: flex;
 *     flex-wrap: nowrap;
 *     will-change: transform;
 *   }
 *
 *   .marquee-item {
 *     flex-shrink: 0;
 *     padding: 0 2rem;
 *   }
 * }
 */
