class Toaster extends gia.Component {
	constructor(element) {
		super(element);

		// Component options configurable via data-options
		this.options = {
			duration: 4000,
			gap: 14,
			maxVisible: 3,
			expandOnHover: true,
			swipeThreshold: 50,
			swipeVelocity: 0.11,
			closeButton: false,
		};

		// State
		this.toasts = []; // Array of toast objects
		this.toastCounter = 0;

		// Leverage Gia's automatic state-to-attribute mapping on the root element
		this.setState({
			isExpanded: false,
		});

		// Swipe tracking
		this.activeSwipeToast = null;
		this.pointerStart = null;
		this.swipeDirection = null;
		this.collapseTimeout = null;
		this.isDismissing = false;
		this.dismissResetTimeout = null;

		// Note: No manual .bind(this) needed! Gia automatically binds all custom methods.
	}

	mount() {
		// Listen to global toast events
		gia.eventbus.on("toast", this.handleToastEvent);

		// Set up gesture and interaction listeners
		this.element.addEventListener("pointerdown", this.handlePointerDown);
		this.element.addEventListener("click", this.handleClick);

		if (this.options.expandOnHover) {
			this.element.addEventListener("mouseenter", this.handleMouseEnter);
			this.element.addEventListener("mouseleave", this.handleMouseLeave);
			// Accessibility for keyboard navigation
			this.element.addEventListener("focusin", this.handleMouseEnter);
			this.element.addEventListener("focusout", this.handleMouseLeave);
		}

		// WCAG: allow dismissing via Escape key
		document.addEventListener("keydown", this.handleKeyDown);

		// Handle window resize for dynamic heights
		this.observeWindowResize(this.handleResize);
	}

	unmount() {
		gia.eventbus.off("toast", this.handleToastEvent);

		this.element.removeEventListener("pointerdown", this.handlePointerDown);
		this.element.removeEventListener("click", this.handleClick);

		// Remove global pointer events just in case unmount happens mid-swipe
		window.removeEventListener("pointermove", this.handlePointerMove);
		window.removeEventListener("pointerup", this.handlePointerUp);

		if (this.options.expandOnHover) {
			this.element.removeEventListener("mouseenter", this.handleMouseEnter);
			this.element.removeEventListener("mouseleave", this.handleMouseLeave);
			this.element.removeEventListener("focusin", this.handleMouseEnter);
			this.element.removeEventListener("focusout", this.handleMouseLeave);
		}

		document.removeEventListener("keydown", this.handleKeyDown);

		// Cleanup timeouts
		for (let i = 0; i < this.toasts.length; i++) {
			clearTimeout(this.toasts[i].timeout);
		}
		if (this.collapseTimeout) {
			clearTimeout(this.collapseTimeout);
		}
		if (this.dismissResetTimeout) {
			clearTimeout(this.dismissResetTimeout);
		}
	}

	stateChange(changes) {
		if ("isExpanded" in changes) {
			this.updateToasts();
		}
	}

	handleResize() {
		this.updateToasts();
	}

	handleToastEvent(data) {
		// Add default properties
		const toastOptions = Object.assign(
			{
				title: "",
				description: "",
				type: "default", // default, success, error, info
				duration: this.options.duration,
				closeButton: this.options.closeButton,
			},
			data,
		);

		this.addToast(toastOptions);
	}

	addToast(options) {
		const id = ++this.toastCounter;
		const createdAt = Date.now();

		// Create the DOM element
		const toastEl = document.createElement("li");
		toastEl.className = "gia-toast";
		toastEl.setAttribute("data-id", id);
		toastEl.setAttribute("data-type", options.type);

		// WCAG: Semantic roles and live regions
		if (options.type === "error") {
			toastEl.setAttribute("role", "alert");
			toastEl.setAttribute("aria-live", "assertive");
		} else {
			toastEl.setAttribute("role", "status");
			toastEl.setAttribute("aria-live", "polite");
		}

		toastEl.setAttribute("data-removed", "false");
		toastEl.setAttribute("data-front", "true");

		// Build inner HTML markup safely
		if (options.title) {
			const titleEl = document.createElement("div");
			titleEl.className = "gia-toast-title";
			titleEl.textContent = options.title;
			toastEl.appendChild(titleEl);
		}
		if (options.description) {
			const descEl = document.createElement("div");
			descEl.className = "gia-toast-desc";
			descEl.textContent = options.description;
			toastEl.appendChild(descEl);
		}
		if (options.closeButton) {
			toastEl.insertAdjacentHTML('beforeend', `<button class="gia-toast-close" aria-label="Close"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`);
		}

		// Setup auto-dismiss timeout
		let timeout = null;
		if (options.duration !== Infinity) {
			timeout = setTimeout(() => {
				this.dismissToast(id);
			}, options.duration);
		}

		const toast = {
			id,
			element: toastEl,
			timeout,
			duration: options.duration,
			createdAt,
			pausedAt: null,
			remaining: options.duration,
		};

		// Prepend to array (newest first/at index 0)
		this.toasts.unshift(toast);

		gia.mutate(() => {
			this.element.appendChild(toastEl);
			this.updateToasts();
		});
	}

	dismissToast(id, direction = "y") {
		const index = this.toasts.findIndex((t) => t.id === id);
		if (index === -1) return;

		const toast = this.toasts[index];
		clearTimeout(toast.timeout);

		// Set a flag so handleMouseLeave knows a toast was just dismissed
		this.isDismissing = true;
		if (this.dismissResetTimeout) clearTimeout(this.dismissResetTimeout);
		this.dismissResetTimeout = setTimeout(() => {
			this.isDismissing = false;
		}, 50);

		gia.mutate(() => {
			toast.element.setAttribute("data-removed", direction);
			toast.element.style.pointerEvents = "none";
			toast.element.style.opacity = "0";
			toast.element.style.transition = ""; // Ensure transition is active

			// Remove from DOM after transition completes (400ms matches CSS)
			setTimeout(() => {
				if (toast.element.parentNode) {
					toast.element.parentNode.removeChild(toast.element);
				}
			}, 400);
		});

		// Remove from active tracking array
		this.toasts.splice(index, 1);
		this.updateToasts();
	}

	updateToasts() {
		// Use Gia's DOM scheduler to prevent layout thrashing
		gia.measure(() => {
			const heights = [];

			// 1. Measure phase (Read from DOM)
			for (let i = 0; i < this.toasts.length; i++) {
				heights.push(this.toasts[i].element.offsetHeight);
			}

			// 2. Mutate phase (Write to DOM)
			gia.mutate(() => {
				let currentOffset = 0;

				for (let i = 0; i < this.toasts.length; i++) {
					const toast = this.toasts[i];
					const el = toast.element;
					const isFront = i === 0;

					el.setAttribute("data-front", isFront.toString());

					// Set CSS variables that control stacking math
					el.style.setProperty("--index", i);
					el.style.setProperty("--toasts-before", i);
					el.style.setProperty("--z-index", this.toasts.length - i);

					if (this.state.isExpanded) {
						el.style.setProperty("--offset-y", `-${currentOffset}px`);
						if (i < this.options.maxVisible) {
							currentOffset += heights[i] + this.options.gap;
						}
					} else {
						el.style.setProperty("--offset-y", `0px`);
					}

					// Visibility logic applies to both expanded and collapsed states
					if (i >= this.options.maxVisible) {
						el.style.opacity = "0";
						el.style.pointerEvents = "none";
						el.inert = true; // WCAG: Remove from focus/screen-reader order
					} else {
						el.style.opacity = "1";
						el.style.pointerEvents = "auto";
						el.inert = false;
					}
				}
			});
		});
	}

	handleMouseEnter() {
		if (this.collapseTimeout) {
			clearTimeout(this.collapseTimeout);
			this.collapseTimeout = null;
		}

		this.setState({ isExpanded: true });

		// Pause auto-dismiss timeouts
		for (let i = 0; i < this.toasts.length; i++) {
			const toast = this.toasts[i];
			clearTimeout(toast.timeout);
			toast.pausedAt = Date.now();
			toast.remaining -= toast.pausedAt - toast.createdAt;
		}
	}

	handleMouseLeave() {
		// Clear any existing timeout to prevent race conditions between focusout and mouseleave
		if (this.collapseTimeout) {
			clearTimeout(this.collapseTimeout);
		}

		// If a toast was just dismissed, the mouse hits empty space instantly, so we need a 450ms
		// delay to allow the next toast to finish its 400ms slide-up animation and catch the mouse.
		// If the user naturally moves their mouse away, we want it to be snappy (60ms).
		const delay = this.isDismissing ? 450 : 60;

		this.collapseTimeout = setTimeout(() => {
			// Double check if the user is still hovering or focused before actually collapsing.
			// This prevents bugs where focusout triggers a collapse while the mouse is still hovering!
			const isHovering = this.element.matches(":hover");
			const isFocused = this.element.contains(document.activeElement);

			if (isHovering || isFocused) {
				return;
			}

			this.setState({ isExpanded: false });

			// Resume timeouts with remaining time
			for (let i = 0; i < this.toasts.length; i++) {
				const toast = this.toasts[i];
				if (toast.duration !== Infinity && toast.remaining > 0) {
					toast.createdAt = Date.now(); // Reset creation time for future pauses
					toast.timeout = setTimeout(() => {
						this.dismissToast(toast.id);
					}, toast.remaining);
				}
			}
		}, delay);
	}

	handlePointerDown(e) {
		const closeBtn = e.target.closest(".gia-toast-close");
		if (closeBtn) return; // Let the click handler deal with the close button

		const toastEl = e.target.closest(".gia-toast");
		if (!toastEl) return;

		this.activeSwipeToast = this.toasts.find((t) => t.element === toastEl);
		if (this.activeSwipeToast) {
			this.pointerStart = { x: e.clientX, y: e.clientY, time: Date.now() };
			this.swipeDirection = null;

			// Attach global listeners only during active swipe
			window.addEventListener("pointermove", this.handlePointerMove);
			window.addEventListener("pointerup", this.handlePointerUp);

			gia.mutate(() => {
				toastEl.style.transition = "none"; // Disable transition for 1:1 drag
			});
		}
	}

	handlePointerMove(e) {
		if (!this.activeSwipeToast || !this.pointerStart) return;

		const deltaX = e.clientX - this.pointerStart.x;
		const deltaY = e.clientY - this.pointerStart.y;

		// Lock axis based on initial movement
		if (!this.swipeDirection) {
			if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
				this.swipeDirection = Math.abs(deltaX) > Math.abs(deltaY) ? "x" : "y";
			} else {
				return;
			}
		}

		gia.mutate(() => {
			if (this.swipeDirection === "x") {
				this.activeSwipeToast.element.style.setProperty("--swipe-amount-x", `${deltaX}px`);
			} else if (this.swipeDirection === "y") {
				if (deltaY < 0) return; // Prevent swiping up
				this.activeSwipeToast.element.style.setProperty("--swipe-amount-y", `${deltaY}px`);
			}
		});
	}

	handlePointerUp(e) {
		if (!this.activeSwipeToast || !this.pointerStart) return;

		const deltaX = e.clientX - this.pointerStart.x;
		const deltaY = e.clientY - this.pointerStart.y;
		const timeTaken = Date.now() - this.pointerStart.time;

		const toast = this.activeSwipeToast;
		const el = toast.element;

		let dismiss = false;

		if (this.swipeDirection === "x") {
			const velocityX = Math.abs(deltaX) / timeTaken;
			if (Math.abs(deltaX) > this.options.swipeThreshold || velocityX > this.options.swipeVelocity) {
				dismiss = true;
				// Maintain trajectory off-screen for a smooth exit
				const sign = deltaX > 0 ? 1 : -1;
				el.style.setProperty("--swipe-amount-x", `${sign * 100}%`);
			}
		} else if (this.swipeDirection === "y") {
			const velocityY = Math.abs(deltaY) / timeTaken;
			if (deltaY > this.options.swipeThreshold || velocityY > this.options.swipeVelocity) {
				dismiss = true;
			}
		}

		if (dismiss) {
			el.style.transition = ""; // Restore transition before dismissing
			this.dismissToast(toast.id, this.swipeDirection);
		} else {
			// Snap back into place
			gia.mutate(() => {
				el.style.transition = ""; // Restore CSS transition
				el.style.setProperty("--swipe-amount-x", "0px");
				el.style.setProperty("--swipe-amount-y", "0px");
			});
		}

		// Clean up global listeners
		window.removeEventListener("pointermove", this.handlePointerMove);
		window.removeEventListener("pointerup", this.handlePointerUp);

		this.activeSwipeToast = null;
		this.pointerStart = null;
		this.swipeDirection = null;
	}

	handleClick(e) {
		const closeBtn = e.target.closest(".gia-toast-close");
		if (closeBtn) {
			const toastEl = closeBtn.closest(".gia-toast");
			if (toastEl) {
				const id = parseInt(toastEl.getAttribute("data-id"), 10);
				this.dismissToast(id);
			}
		}
	}

	handleKeyDown(e) {
		if (e.key === "Escape" && this.toasts.length > 0) {
			// Dismiss the focused toast, or the front-most toast if none are focused
			const focusedToast = document.activeElement ? document.activeElement.closest(".gia-toast") : null;
			if (focusedToast) {
				const id = parseInt(focusedToast.getAttribute("data-id"), 10);
				this.dismissToast(id);
			} else {
				this.dismissToast(this.toasts[0].id);
			}
		}
	}
}

gia.register(Toaster, { priority: -100 });
