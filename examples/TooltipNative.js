class TooltipNative extends gia.Component {
	constructor(element) {
		super(element);
		// Unique anchor ID for this trigger
		this.anchorId = `tooltip-trigger-${Math.random().toString(36).substr(2, 9)}`;
	}

	async require() {
		// Cache the loading promise statically so it only executes once globally,
		// preventing multiple instances from logging or initiating redundant checks simultaneously.
		if (!TooltipNative.polyfillsPromise) {
			TooltipNative.polyfillsPromise = (async () => {
				const promises = [];

				if (!("popover" in HTMLElement.prototype)) {
					console.info("TooltipNative: HTML Popover API not supported natively, loading polyfill...");
					promises.push(import("https://unpkg.com/@oddbird/popover-polyfill@latest/dist/popover.min.js"));
				}

				if (!("anchorName" in document.documentElement.style)) {
					console.info("TooltipNative: CSS Anchor Positioning not supported natively, loading polyfill...");
					promises.push(import("https://unpkg.com/@oddbird/css-anchor-positioning"));
				}

				await Promise.all(promises);
			})();
		}

		return TooltipNative.polyfillsPromise;
	}

	mount() {
		this.text = this.element.getAttribute("data-tooltip");
		this.position = this.element.getAttribute("data-position") || "top";
		// Default to individual tooltip unless a group is specified
		this.group = this.element.getAttribute("data-tooltip-group") || this.anchorId;

		if (!this.text) {
			console.warn("TooltipNative: No data-tooltip attribute found on element.");
			return;
		}

		// Initialize the Map for managing multiple singleton groups
		if (!TooltipNative.groups) {
			TooltipNative.groups = new Map();

			// WCAG 1.4.13: Dismissible via Escape key
			window.addEventListener("keydown", (e) => {
				if (e.key === "Escape" || e.key === "Esc") {
					TooltipNative.groups.forEach((groupData, groupKey) => {
						if (groupData.isOpen) TooltipNative.hideGroup(groupKey);
					});
				}
			});
		}

		// Get or create the singleton popover for this group
		if (!TooltipNative.groups.has(this.group)) {
			const popup = document.createElement("div");
			popup.id = `gia-tooltip-native-${this.group}`;

			// We use 'manual' popover to tightly control showing/hiding on hover/focus
			popup.popover = "manual";
			popup.className = "gia-tooltip-native-popover";

			// Create a dedicated content container to manage crossfading text nodes
			const contentContainer = document.createElement("div");
			contentContainer.className = "gia-tooltip-native-content";
			contentContainer.style.position = "relative";
			popup.appendChild(contentContainer);

			const arrow = document.createElement("div");
			arrow.className = "gia-tooltip-native-arrow";
			popup.appendChild(arrow);

			document.body.appendChild(popup);

			const groupData = {
				popup,
				contentContainer,
				arrow,
				isOpen: false,
				activeTrigger: null,
				hideTimeout: null,
			};

			// WCAG 1.4.13: Hoverable - keep open when moving mouse over the tooltip itself
			popup.addEventListener("mouseenter", () => {
				if (groupData.hideTimeout) clearTimeout(groupData.hideTimeout);
			});
			popup.addEventListener("mouseleave", () => {
				TooltipNative.hideGroup(this.group);
			});

			TooltipNative.groups.set(this.group, groupData);
		}

		this.groupData = TooltipNative.groups.get(this.group);

		// MANDATORY: Explicitly set anchor-name on the trigger for polyfill compatibility
		this.anchorName = `--${this.anchorId}`;
		this.element.style.anchorName = this.anchorName;

		// Accessibility: associate the trigger with the tooltip content
		this.element.setAttribute("aria-describedby", this.groupData.popup.id);

		// Bind interaction events
		this.element.addEventListener("mouseenter", this.handleShow);
		this.element.addEventListener("focus", this.handleShow);
		this.element.addEventListener("mouseleave", this.handleHide);
		this.element.addEventListener("blur", this.handleHide);
	}

	unmount() {
		this.element.removeEventListener("mouseenter", this.handleShow);
		this.element.removeEventListener("focus", this.handleShow);
		this.element.removeEventListener("mouseleave", this.handleHide);
		this.element.removeEventListener("blur", this.handleHide);

		// Note: We don't automatically destroy the group singleton here because
		// other instances in the same group might still be using it.
	}

	applyPositionStyles(popup) {
		// Re-anchor the singleton popover to the newly hovered trigger
		popup.style.positionAnchor = this.anchorName;

		// Reset insets so we can recalculate them cleanly
		popup.style.top = "auto";
		popup.style.bottom = "auto";
		popup.style.left = "auto";
		popup.style.right = "auto";

		// Clear custom margin properties
		popup.style.marginTop = "0";
		popup.style.marginBottom = "0";
		popup.style.marginLeft = "0";
		popup.style.marginRight = "0";

		// Position using anchor() functions for maximum polyfill compatibility
		if (this.position === "top") {
			popup.style.bottom = "anchor(top)";
			popup.style.left = "anchor(center)";
			popup.style.transform = "translate(-50%, 0)";
			popup.style.marginBottom = "8px"; // Spacing for the arrow
		} else if (this.position === "bottom") {
			popup.style.top = "anchor(bottom)";
			popup.style.left = "anchor(center)";
			popup.style.transform = "translate(-50%, 0)";
			popup.style.marginTop = "8px";
		} else if (this.position === "left") {
			popup.style.top = "anchor(center)";
			popup.style.right = "anchor(left)";
			popup.style.transform = "translate(0, -50%)";
			popup.style.marginRight = "8px";
		} else if (this.position === "right") {
			popup.style.top = "anchor(center)";
			popup.style.left = "anchor(right)";
			popup.style.transform = "translate(0, -50%)";
			popup.style.marginLeft = "8px";
		}

		// Apply the dynamic position-try attribute so CSS knows which fallback to use
		popup.setAttribute("data-position", this.position);
	}

	handleShow() {
		if (this.groupData.hideTimeout) {
			clearTimeout(this.groupData.hideTimeout);
			this.groupData.hideTimeout = null;
		}

		if (this.groupData.activeTrigger === this && this.groupData.isOpen) return;

		const previousTrigger = this.groupData.activeTrigger;
		this.groupData.activeTrigger = this;

		const { popup, contentContainer } = this.groupData;

		if (this.groupData.isOpen) {
			// Determine direction based on trigger positions
			let slideDir = 1; // 1 = moving right, -1 = moving left
			if (previousTrigger) {
				const oldRect = previousTrigger.element.getBoundingClientRect();
				const newRect = this.element.getBoundingClientRect();
				if (newRect.left > oldRect.left) {
					slideDir = 1;
				} else if (newRect.left < oldRect.left) {
					slideDir = -1;
				} else if (newRect.top > oldRect.top) {
					slideDir = 1; // Fallback to Y axis ordering if perfectly vertically stacked
				} else {
					slideDir = -1;
				}
			}
			
			const enterX = 10 * slideDir;
			const exitX = -10 * slideDir;

			// FLIP animation to morph width and height smoothly
			gia.measure(() => {
				const oldWidth = popup.offsetWidth;
				const oldHeight = popup.offsetHeight;

				gia.mutate(() => {
					// Temporarily remove transitions to snap to intrinsic size for measurement
					popup.style.transition = 'none';
					
					// Crossfade text logic
					const oldSpan = contentContainer.lastElementChild;
					const newSpan = document.createElement("span");
					newSpan.textContent = this.text;
					newSpan.style.display = 'block';
					newSpan.style.whiteSpace = 'nowrap';
					
					// Start new text off-screen horizontally
					newSpan.style.opacity = '0';
					newSpan.style.transform = `translateX(${enterX}px)`;
					newSpan.style.transition = 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
					
					if (oldSpan) {
						oldSpan.style.position = 'absolute';
						oldSpan.style.left = '0';
						oldSpan.style.top = '0';
						// Ensure old span has its starting values explicitly
						oldSpan.style.opacity = '1';
						oldSpan.style.transform = 'translateX(0)';
						
						// Clean up the old span after the fade completes
						setTimeout(() => {
							if (oldSpan.parentNode) oldSpan.parentNode.removeChild(oldSpan);
						}, 400);
					}
					contentContainer.appendChild(newSpan);

					popup.style.width = 'auto';
					popup.style.height = 'auto';
					// We do NOT apply position styles yet, so they don't snap while transitions are disabled!

					gia.measure(() => {
						const newWidth = popup.offsetWidth;
						const newHeight = popup.offsetHeight;

						gia.mutate(() => {
							// Invert: Revert to old dimensions instantly
							popup.style.width = `${oldWidth}px`;
							popup.style.height = `${oldHeight}px`;

							// Force layout recalculation
							popup.clientWidth;

							// Play: Restore transitions and animate to new dimensions
							popup.style.transition = "";
							popup.style.width = `${newWidth}px`;
							popup.style.height = `${newHeight}px`;

							// Trigger animation for the new text sliding up into view
							newSpan.style.opacity = "1";
							newSpan.style.transform = "translateX(0)";

							// Trigger animation for old text sliding up out of view
							if (oldSpan) {
								oldSpan.style.opacity = "0";
								oldSpan.style.transform = `translateX(${exitX}px)`;
							}

							// Now that transitions are restored, apply the new position styles to morph the inset
							this.applyPositionStyles(popup);
						});
					});
				});
			});
		} else {
			// Initial opening
			gia.mutate(() => {
				const newSpan = document.createElement("span");
				newSpan.textContent = this.text;
				newSpan.style.display = 'block';
				newSpan.style.whiteSpace = 'nowrap';
				newSpan.style.transition = 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
				newSpan.style.opacity = '1';
				newSpan.style.transform = 'translateX(0)';
				
				contentContainer.innerHTML = '';
				contentContainer.appendChild(newSpan);

				popup.style.width = "auto";
				popup.style.height = "auto";

				this.applyPositionStyles(popup);

				if (typeof popup.showPopover === "function") {
					// ⚡ BOLT OPTIMIZATION: Force layout recalculation before showing to ensure
					// @starting-style CSS animations execute correctly on the very first render
					popup.style.display = "block";
					popup.clientWidth;
					popup.style.display = "";

					popup.showPopover();
				} else {
					popup.style.display = "block";
				}
				this.groupData.isOpen = true;
			});
		}
	}

	handleHide() {
		// Add a tiny delay to allow moving mouse from trigger to tooltip or between triggers smoothly
		this.groupData.hideTimeout = setTimeout(() => {
			TooltipNative.hideGroup(this.group);
		}, 100);
	}

	static hideGroup(groupKey) {
		const groupData = TooltipNative.groups.get(groupKey);
		if (!groupData || !groupData.isOpen) return;

		groupData.isOpen = false;
		groupData.activeTrigger = null;

		gia.mutate(() => {
			if (typeof groupData.popup.hidePopover === "function") {
				groupData.popup.hidePopover();
			} else {
				groupData.popup.style.display = "none";
			}
		});
	}
}

gia.register(TooltipNative, { priority: -75 });

/*
========================================
EXPECTED HTML
========================================

<button data-component="TooltipNative" data-tooltip="Individual Tooltip" data-position="top">
  Individual
</button>

<button data-component="TooltipNative" data-tooltip-group="menu" data-tooltip="Grouped Item 1" data-position="top">
  Group 1
</button>

<button data-component="TooltipNative" data-tooltip-group="menu" data-tooltip="Grouped Item 2" data-position="bottom">
  Group 2
</button>

========================================
SUGGESTED SCSS
========================================

.gia-tooltip-native-popover {
  // Premium Solid Design
  .gia-tooltip-native-arrow {
    position: absolute;
    width: 10px;
    height: 10px;
    background-color: #1e1e20;
    border: 1px solid #36363a;
    transform: rotate(45deg);
  }

  &[data-position="top"] .gia-tooltip-native-arrow {
    bottom: -5px;
    left: 50%;
    margin-left: -5px;
    clip-path: polygon(100% 100%, 0 100%, 100% 0);
  }

  &[data-position="bottom"] .gia-tooltip-native-arrow {
    top: -5px;
    left: 50%;
    margin-left: -5px;
    clip-path: polygon(0 0, 0 100%, 100% 0);
  }

  &[data-position="left"] .gia-tooltip-native-arrow {
    right: -5px;
    top: 50%;
    margin-top: -5px;
    clip-path: polygon(100% 0, 0 0, 100% 100%);
  }

  &[data-position="right"] .gia-tooltip-native-arrow {
    left: -5px;
    top: 50%;
    margin-top: -5px;
    clip-path: polygon(0 100%, 0 0, 100% 100%);
  }  
  
  background-color: #1e1e20;
  
  // Typography
  color: #fff;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  
  // Spacing & Borders
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  border: 1px solid #36363a;
  
  // Depth
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1)) drop-shadow(0 10px 15px rgba(0, 0, 0, 0.2));

  white-space: nowrap;
  z-index: 1000;
  overflow: visible; // Prevent tooltip from being scrollable

  // Modern popovers reset
  margin: 0;
  inset: auto;
  
  // Animate the size and inset changes for the "Singleton" Tippy-like morphing effect!
  transition: opacity 0.3s ease, 
              transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              inset 0.4s cubic-bezier(0.16, 1, 0.3, 1), 
              width 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              height 0.4s cubic-bezier(0.16, 1, 0.3, 1),
              overlay 0.3s allow-discrete, 
              display 0.3s allow-discrete;
              
  opacity: 0;
  transform: scale(0.9);

  // Position-try fallbacks explicitly linked to the starting direction via attribute
  &[data-position="top"] {
    position-try: flip-block;
  }
  &[data-position="bottom"] {
    position-try: flip-block;
  }
  &[data-position="left"] {
    position-try: flip-inline;
  }
  &[data-position="right"] {
    position-try: flip-inline;
  }

  // Combine popover-open with the polyfill class
  &:is(:popover-open, .\:popover-open) {
    opacity: 1;
    transform: scale(1);
  }

}
*/
