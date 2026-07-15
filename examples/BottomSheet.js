class BottomSheet extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			dampTop: 0.15,
			closeThreshold: 0.25,
			velocityThreshold: 0.4,
			scaleBackground: false,
			scaleFactor: 0.9,
			scaleRadius: 12,
			scaleOffset: 14,
		};

		this.physics = {
			scale: 0.97,
			radius: 12,
			offset: 14,
			opacity: 0.4,
		};

		this.ref = {
			drawer: null,
			overlay: null,
			scrollable: null,
			closeBtn: [],
		};

		this.dragState = {
			isDragging: false,
			startY: 0,
			currentY: 0,
			drawerHeight: 0,
			lastY: 0,
			lastTime: 0,
			velocity: 0,
			activePointerId: null,
		};

		this.activeElementBeforeOpen = null;

		this.setState({
			isOpen: false,
			isDragging: false,
		});

		this.bottomSheetId = this.element.id;
		this.triggers = this.bottomSheetId ? document.querySelectorAll(`[data-bottom-sheet-target="${this.bottomSheetId}"]`) : [];
	}

	mount() {
		for (let i = 0; i < this.triggers.length; i++) {
			this.triggers[i].addEventListener("click", this.handleTriggerClick);
		}

		if (this.ref.closeBtn) {
			for (let i = 0; i < this.ref.closeBtn.length; i++) {
				this.ref.closeBtn[i].addEventListener("click", this.close);
			}
		}

		if (this.ref.overlay) {
			this.ref.overlay.addEventListener("click", this.close);
		}

		// Make fully compatible with Lenis smooth scrolling
		this.element.setAttribute("data-lenis-prevent", "true");

		if (this.ref.drawer) {
			this.observeResize(this.ref.drawer, this.handleDrawerResize);
			this.ref.drawer.addEventListener("pointerdown", this.handlePointerDown);
		}

		this.wrapper = document.querySelector("[data-bottom-sheet-wrapper]");

		document.addEventListener("keydown", this.handleKeyDown);

		const hash = window.location.hash;
		if (hash && this.bottomSheetId && hash === `#${this.bottomSheetId}`) {
			this.setState({ isOpen: true });
		}
	}

	unmount() {
		for (let i = 0; i < this.triggers.length; i++) {
			this.triggers[i].removeEventListener("click", this.handleTriggerClick);
		}

		if (this.ref.closeBtn) {
			for (let i = 0; i < this.ref.closeBtn.length; i++) {
				this.ref.closeBtn[i].removeEventListener("click", this.close);
			}
		}

		if (this.ref.overlay) {
			this.ref.overlay.removeEventListener("click", this.close);
		}

		if (this.ref.drawer) {
			this.unobserveResize(this.ref.drawer, this.handleDrawerResize);
			this.ref.drawer.removeEventListener("pointerdown", this.handlePointerDown);
		}

		document.removeEventListener("keydown", this.handleKeyDown);
	}

	handleTriggerClick(e) {
		e.preventDefault();
		this.setState({ isOpen: true });
	}

	handleKeyDown(e) {
		if (this.state.isOpen && e.key === "Escape") {
			this.close();
		}
	}

	close(e) {
		if (e) e.preventDefault();
		this.setState({ isOpen: false });
	}

	handleDrawerResize(entries) {
		const entry = entries[0];
		this.dragState.drawerHeight = entry.borderBoxSize ? entry.borderBoxSize[0].blockSize : entry.contentRect.height;

		// Extract CSS variables during resize/mount so physics adapt to media queries off the hot path
		gia.measure(() => {
			if (this.options.scaleBackground && this.wrapper) {
				const style = window.getComputedStyle(this.wrapper);
				const scale = parseFloat(style.getPropertyValue("--bs-scale"));
				if (!isNaN(scale)) this.physics.scale = scale;

				const radius = parseFloat(style.getPropertyValue("--bs-radius"));
				if (!isNaN(radius)) this.physics.radius = radius;

				const offset = parseFloat(style.getPropertyValue("--bs-offset"));
				if (!isNaN(offset)) this.physics.offset = offset;
			}
			if (this.ref.overlay) {
				const style = window.getComputedStyle(this.ref.overlay);
				const opacity = parseFloat(style.getPropertyValue("--bs-opacity"));
				if (!isNaN(opacity)) this.physics.opacity = opacity;
			}
		});
	}

	_getComputedTranslateY(element) {
		const style = window.getComputedStyle(element);
		if (style.transform && style.transform !== "none") {
			const matrix = new (window.DOMMatrix || window.WebKitCSSMatrix)(style.transform);
			return matrix.m42;
		}
		return 0;
	}

	handlePointerDown(e) {
		// Ignore interactive elements so they can be clicked normally
		if (e.target.closest("button, a, input, textarea, select, [data-bottom-sheet-no-drag]")) return;

		// Ignore multi-touch: if we are already dragging with another finger
		if (this.dragState.isDragging && this.dragState.activePointerId !== e.pointerId) return;

		// Check if we are interacting with scrollable content inside the drawer
		if (this.ref.scrollable && this.ref.scrollable.contains(e.target)) {
			// Only allow dragging if scrolled to the absolute top, just like iOS
			if (this.ref.scrollable.scrollTop > 0) {
				return;
			}
		}

		// Queue DOM read in next animation frame to prevent forced layout
		gia.measure(() => {
			const currentY = this._getComputedTranslateY(this.ref.drawer);

			this.dragState.isDragging = true;
			this.dragState.activePointerId = e.pointerId;
			this.dragState.startY = e.clientY - currentY;
			this.dragState.currentY = currentY;
			this.dragState.lastY = e.clientY;
			this.dragState.lastTime = e.timeStamp;
			this.dragState.velocity = 0;

			this.setState({ isDragging: true });

			// Freeze the drawer exactly where it is mid-animation
			gia.mutate(() => {
				if (this.ref.drawer) {
					this.ref.drawer.style.transform = `translateY(${currentY}px)`;
				}
				if (this.ref.overlay) {
					const progress = currentY / this.dragState.drawerHeight;
					const opacity = this.physics.opacity - progress * this.physics.opacity;
					this.ref.overlay.style.opacity = Math.min(Math.max(0, opacity), 1).toFixed(3);
				}
				if (this.options.scaleBackground && this.wrapper) {
					const progress = currentY / this.dragState.drawerHeight;
					const scaleDiff = 1 - this.physics.scale;
					const scale = this.physics.scale + progress * scaleDiff;
					const radius = this.physics.radius - progress * this.physics.radius;
					const yOffset = this.physics.offset - progress * this.physics.offset;
					this.wrapper.style.transform = `scale(${Math.min(scale, 1)}) translateY(calc(env(safe-area-inset-top) + ${Math.max(yOffset, 0)}px))`;
					this.wrapper.style.borderRadius = `${Math.max(radius, 0)}px`;
				}
			});
		});

		this.ref.drawer.setPointerCapture(e.pointerId);
		this.ref.drawer.addEventListener("pointermove", this.handlePointerMove);
		this.ref.drawer.addEventListener("pointerup", this.handlePointerUp);
		this.ref.drawer.addEventListener("pointercancel", this.handlePointerUp);
	}

	handlePointerMove(e) {
		if (!this.dragState.isDragging || e.pointerId !== this.dragState.activePointerId) return;

		let deltaY = e.clientY - this.dragState.startY;

		// Dampen the drag if pulling upwards past the top (rubber-banding)
		if (deltaY < 0) {
			deltaY = deltaY * this.options.dampTop;
		}

		// Calculate velocity using sub-millisecond precise e.timeStamp for high refresh rate monitors
		const now = e.timeStamp;
		const dt = now - this.dragState.lastTime;
		if (dt > 0) {
			this.dragState.velocity = (e.clientY - this.dragState.lastY) / dt;
		}
		this.dragState.lastY = e.clientY;
		this.dragState.lastTime = now;
		this.dragState.currentY = deltaY;

		// We use gia.mutate to schedule DOM writes safely in the next animation frame
		gia.mutate(() => {
			if (this.ref.drawer) {
				// We apply transform directly instead of CSS variables for maximum performance
				this.ref.drawer.style.transform = `translateY(${Math.max(deltaY, -this.dragState.drawerHeight * 0.2)}px)`;
			}

			// Adjust overlay opacity based on drag distance (works for both pulling up and down)
			if (this.ref.overlay) {
				const progress = deltaY / this.dragState.drawerHeight;
				const opacity = this.physics.opacity - progress * this.physics.opacity;
				this.ref.overlay.style.opacity = Math.min(Math.max(0, opacity), 1).toFixed(3);
			}

			if (this.options.scaleBackground && this.wrapper) {
				const progress = deltaY / this.dragState.drawerHeight;
				const scaleDiff = 1 - this.physics.scale;
				const scale = this.physics.scale + progress * scaleDiff;
				const radius = this.physics.radius - progress * this.physics.radius;
				const yOffset = this.physics.offset - progress * this.physics.offset;
				this.wrapper.style.transform = `scale(${Math.min(scale, 1)}) translateY(calc(env(safe-area-inset-top) + ${Math.max(yOffset, 0)}px))`;
				this.wrapper.style.borderRadius = `${Math.max(radius, 0)}px`;
			}
		});
	}

	handlePointerUp(e) {
		if (!this.dragState.isDragging || e.pointerId !== this.dragState.activePointerId) return;

		this.dragState.isDragging = false;
		this.dragState.activePointerId = null;

		this.ref.drawer.releasePointerCapture(e.pointerId);
		this.ref.drawer.removeEventListener("pointermove", this.handlePointerMove);
		this.ref.drawer.removeEventListener("pointerup", this.handlePointerUp);
		this.ref.drawer.removeEventListener("pointercancel", this.handlePointerUp);

		this.setState({ isDragging: false });

		const draggedRatio = this.dragState.currentY / this.dragState.drawerHeight;
		const isFastFlick = this.dragState.velocity > this.options.velocityThreshold;
		const isDraggedFarEnough = draggedRatio > this.options.closeThreshold;

		if (this.dragState.currentY > 0 && (isFastFlick || isDraggedFarEnough)) {
			// Threshold crossed, close the drawer
			this.setState({ isOpen: false });
		} else {
			// Snap back to open state
			gia.mutate(() => {
				if (this.ref.drawer) this.ref.drawer.style.transform = "";
				if (this.ref.overlay) {
					this.ref.overlay.style.opacity = "";
				}

				if (this.options.scaleBackground && this.wrapper) {
					this.wrapper.style.transform = "";
					this.wrapper.style.borderRadius = "";
				}
			});
		}
	}

	stateChange(changes) {
		if ("isOpen" in changes) {
			const { isOpen } = changes;

			if (isOpen) {
				this.activeElementBeforeOpen = document.activeElement;

				if (this.wrapper) {
					this.wrapper.setAttribute("inert", ""); // Traps focus and screen readers in drawer
				}

				// Lock background scrolling (works natively and stops Lenis)
				document.body.style.overflow = "hidden";

				gia.mutate(() => {
					if (this.ref.drawer) this.ref.drawer.focus();
				});
			} else {
				if (this.wrapper) {
					this.wrapper.removeAttribute("inert");
				}

				document.body.style.overflow = "";

				if (this.activeElementBeforeOpen) {
					this.activeElementBeforeOpen.focus();
					this.activeElementBeforeOpen = null;
				}
			}

			gia.mutate(() => {
				for (let i = 0; i < this.triggers.length; i++) {
					this.triggers[i].setAttribute("aria-expanded", isOpen ? "true" : "false");
				}

				if (isOpen) {
					document.body.style.overflow = "hidden";

					if (this.options.scaleBackground) {
						const wrapper = document.querySelector("[data-bottom-sheet-wrapper]");
						if (wrapper) {
							wrapper.style.transformOrigin = `center ${window.scrollY}px`;
							wrapper.setAttribute("data-bottom-sheet-scaled", "true");
						}
					}

					if (window.lenis) window.lenis.stop();

					if (this.bottomSheetId && window.location.hash !== `#${this.bottomSheetId}`) {
						history.pushState(null, "", `#${this.bottomSheetId}`);
					}
				} else {
					document.body.style.overflow = "";

					if (this.options.scaleBackground) {
						const wrapper = document.querySelector("[data-bottom-sheet-wrapper]");
						if (wrapper) {
							wrapper.removeAttribute("data-bottom-sheet-scaled");
							wrapper.style.transform = "";
							wrapper.style.borderRadius = "";
						}
					}

					if (window.lenis) window.lenis.start();

					if (this.ref.drawer) this.ref.drawer.style.transform = "";
					if (this.ref.overlay) this.ref.overlay.style.opacity = "";

					if (this.bottomSheetId && window.location.hash === `#${this.bottomSheetId}`) {
						const urlWithoutHash = window.location.pathname + window.location.search;
						history.pushState(null, "", urlWithoutHash || "#");
					}
				}
			});
		}

		if ("isDragging" in changes) {
			gia.mutate(() => {
				if (changes.isDragging) {
					if (this.ref.drawer) this.ref.drawer.style.transition = "none";
					if (this.ref.overlay) this.ref.overlay.style.transition = "none";
					if (this.options.scaleBackground) {
						const wrapper = document.querySelector("[data-bottom-sheet-wrapper]");
						if (wrapper) {
							wrapper.style.transition = "none";
						}
					}
				} else {
					if (this.ref.drawer) {
						this.ref.drawer.style.transition = "";
						void this.ref.drawer.offsetHeight; // Force reflow to ensure transition is applied before transform changes
					}
					if (this.ref.overlay) {
						this.ref.overlay.style.transition = "";
					}
					if (this.options.scaleBackground) {
						const wrapper = document.querySelector("[data-bottom-sheet-wrapper]");
						if (wrapper) {
							wrapper.style.transition = "";
							void wrapper.offsetHeight; // Force reflow
						}
					}
				}
			});
		}
	}
}

gia.register(BottomSheet, { priority: -100 });

/*
========================================
EXPECTED HTML
========================================

<button data-bottom-sheet-target="my-sheet" aria-expanded="false" aria-controls="my-sheet">Open Drawer</button>

<div class="bottom-sheet" data-component="BottomSheet" id="my-sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
  <div data-ref="overlay" aria-hidden="true"></div>
  <div data-ref="drawer" tabindex="-1">
    <div data-ref="handle" aria-hidden="true"></div>
    <div data-ref="scrollable">
      <h2 id="sheet-title">Drawer Title</h2>
      <p>Scrollable content goes here.</p>
      <button data-ref="closeBtn">Close</button>
    </div>
  </div>
</div>

========================================
SUGGESTED SCSS
========================================

.bottom-sheet[data-component="BottomSheet"] {
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;

  [data-ref="overlay"] {
    position: absolute;
    inset: 0;
    background: #000;
    opacity: 0;
    transition: opacity 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    pointer-events: none;
  }

  [data-ref="drawer"] {
    position: relative;
    background: #fff;
    border-radius: 16px 16px 0 0;
    width: 100%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    transform: translateY(100%);
    transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1);
    will-change: transform;
    pointer-events: auto;
    touch-action: none;

    &:focus {
      outline: none;
    }

    // Extension to hide background gap when dragging up
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      height: 200vh;
      background-color: inherit;
    }
  }

  [data-ref="handle"] {
    width: 36px;
    height: 5px;
    background: #ddd;
    border-radius: 3px;
    margin: 12px auto;
    flex-shrink: 0;
  }

  [data-ref="scrollable"] {
    padding: 0 24px 24px;
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    flex-grow: 1;
  }

  // Active state handling
  &[data-is-open="true"] {
    pointer-events: auto;

    [data-ref="overlay"] {
      opacity: 0.4;
      pointer-events: auto;
    }
    
    [data-ref="drawer"] {
      transform: translateY(0);
    }
  }

  // Dragging state
  &[data-is-dragging="true"] {
    [data-ref="drawer"],
    [data-ref="overlay"] {
      transition: none !important;
    }
  }
}

// Body always black, hidden behind wrapper until scaled
body {
  background-color: #000 !important;
}

// Wrapper scale effect (optional, enable with options.scaleBackground: true)
[data-bottom-sheet-wrapper] {
  transition: transform 0.5s cubic-bezier(0.32, 0.72, 0, 1), border-radius 0.5s cubic-bezier(0.32, 0.72, 0, 1), background-color 0.5s cubic-bezier(0.32, 0.72, 0, 1), color 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  background: var(--bg-color, #fff);
  min-height: 100vh;

  &[data-bottom-sheet-scaled="true"] {
    transform: scale(0.97) translateY(calc(env(safe-area-inset-top) + 14px));
    border-radius: 12px;
    overflow: hidden;
  }
}

// Disable text selection and transitions globally while dragging
body:has(.bottom-sheet[data-is-dragging="true"]) [data-bottom-sheet-wrapper] {
  user-select: none;
  -webkit-user-select: none;
  transition: none !important;
}
*/
