class CustomCursor extends gia.Component {
    constructor(element) {
        super(element);

        this.options = {
            friction: 0.8, // The lerp friction. Lower = slower. 0.8 is quite responsive
            magneticStrength: 0.3, // How much the magnetic element is pulled towards the mouse
            magneticPadding: 40 // The extended magnetic zone beyond the element bounds
        };

        this.ref = {
            dot: null, // The main cursor dot
            text: null // The text container inside the cursor
        };

        // Pre-bind methods for performance in requestAnimationFrame and event listeners
        this.render = this.render.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);

        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // For magnetic target
        this.magneticTarget = null;
        this.magneticBounds = null;

        // Cache of all magnetic elements to avoid layout thrashing during mousemove
        this.cachedMagneticElements = [];

        // Current visual state
        this.currentState = 'default';
        this.currentText = '';

        // Animation loop control
        this._rafId = null;
        this._isRenderingFrame = false;
        this._needsAllBoundsUpdate = true;
        this._lastTime = performance.now();
        this._lastDotTransform = '';
        this._lastMagneticTransform = '';
        this._currentPullX = 0;
        this._currentPullY = 0;

        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Observers to keep bounds up to date
        this.resizeObserver = null;
        this.mutationObserver = null;
    }

    mount() {
        if (this.prefersReducedMotion) {
            // If user prefers reduced motion, disable friction for instant snapping
            this.options.friction = 1;
        }

        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        window.addEventListener('scroll', this.handleScroll, { passive: true });
        window.addEventListener('resize', this.handleResize, { passive: true });

        // Setup observers to trigger bounds updates
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(this.handleResize);
            this.resizeObserver.observe(document.body);
        }

        if (window.MutationObserver) {
            this.mutationObserver = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                for (const mutation of mutations) {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        shouldUpdate = true;
                        break;
                    }
                }
                if (shouldUpdate) {
                    this._needsAllBoundsUpdate = true;
                    this._wakeUp();
                }
            });
            this.mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-magnetic', 'class'] });
        }

        // Start the render loop initially
        this._lastTime = performance.now();
        this._isRenderingFrame = true;
        this._rafId = requestAnimationFrame(this.render);
    }

    unmount() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }

        this._isRenderingFrame = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }

        // Reset any currently active magnetic element
        if (this.magneticTarget) {
            this.magneticTarget.style.transform = '';
            this._lastMagneticTransform = '';
            this.magneticTarget.classList.remove('is-magnetic-active');
            this.magneticTarget = null;
        }
    }

    _wakeUp() {
        if (!this._isRenderingFrame) {
            this._lastTime = performance.now();
            this._isRenderingFrame = true;
            this._rafId = requestAnimationFrame(this.render);
        }
    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;

        this._wakeUp();

        // Process interactions via event delegation
        this._processInteractions(e.target);
    }

    handleScroll() {
        this._needsAllBoundsUpdate = true;
        this._wakeUp();
    }

    handleResize() {
        this._needsAllBoundsUpdate = true;
        this._wakeUp();
    }

    _processInteractions(target) {
        // Text Hover
        const textHoverEl = target.closest('[data-hover-text]');
        if (textHoverEl) {
            const hoverText = textHoverEl.getAttribute('data-hover-text');
            if (this.currentState !== 'text' || this.currentText !== hoverText) {
                this.currentState = 'text';
                this.currentText = hoverText;
                this.element.setAttribute('data-cursor-state', 'text');
                if (this.ref.text) {
                    this.ref.text.textContent = hoverText;
                }
            }
        } else if (this.currentState === 'text') {
            this.currentState = 'default';
            this.currentText = '';
            this.element.setAttribute('data-cursor-state', 'default');
            if (this.ref.text) {
                this.ref.text.textContent = '';
            }
        }

        // Magnetic Hover logic
        // We find the closest magnetic element from the cached bounds
        let closestMagneticEl = null;
        let isSnapped = false;
        let minDistanceSq = Infinity;

        for (const item of this.cachedMagneticElements) {
            const { el, bounds } = item;

            // Check if mouse is within the padded bounds
            if (
                this.mouse.x >= bounds.left - this.options.magneticPadding &&
                this.mouse.x <= bounds.right + this.options.magneticPadding &&
                this.mouse.y >= bounds.top - this.options.magneticPadding &&
                this.mouse.y <= bounds.bottom + this.options.magneticPadding
            ) {
                // Find the closest one by center distance to handle overlapping padded zones
                const dx = this.mouse.x - bounds.centerX;
                const dy = this.mouse.y - bounds.centerY;
                const distSq = dx * dx + dy * dy;

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closestMagneticEl = el;
                    this.magneticBounds = bounds;

                    // Check if directly over or very near the element itself
                    isSnapped = (
                        this.mouse.x >= bounds.left - 5 &&
                        this.mouse.x <= bounds.right + 5 &&
                        this.mouse.y >= bounds.top - 5 &&
                        this.mouse.y <= bounds.bottom + 5
                    );
                }
            }
        }

        // Handle entering/changing magnetic element pull zone
        if (closestMagneticEl && this.magneticTarget !== closestMagneticEl) {
            if (this.magneticTarget) {
                this.magneticTarget.style.transform = '';
                this._lastMagneticTransform = '';
                this.magneticTarget.classList.remove('is-magnetic-active');
            }
            this.magneticTarget = closestMagneticEl;
            this.magneticTarget.classList.add('is-magnetic-active');
            this._currentPullX = 0;
            this._currentPullY = 0;
        } else if (!closestMagneticEl && this.magneticTarget) {
            // Exit magnetic element completely
            this.magneticTarget.style.transform = '';
            this._lastMagneticTransform = '';
            this.magneticTarget.classList.remove('is-magnetic-active');
            this.magneticTarget = null;
            this.magneticBounds = null;
        }

        // Handle Snapping Visual State
        if (isSnapped) {
            // If we are snapping onto a new element, update the bounds!
            const isNewSnapTarget = this._snappedTarget !== closestMagneticEl;

            if (this.currentState !== 'magnetic' || isNewSnapTarget) {
                this.currentState = 'magnetic';
                this._snappedTarget = closestMagneticEl;
                this.element.setAttribute('data-cursor-state', 'magnetic');

                // Set inline styles to "embrace" the element
                if (this.ref.dot) {
                    const computedStyle = window.getComputedStyle(this.magneticTarget);
                    const borderRadius = computedStyle.borderRadius || '0px';

                    this.ref.dot.style.width = `${this.magneticBounds.width}px`;
                    this.ref.dot.style.height = `${this.magneticBounds.height}px`;
                    this.ref.dot.style.marginLeft = `${-this.magneticBounds.width / 2}px`;
                    this.ref.dot.style.marginTop = `${-this.magneticBounds.height / 2}px`;
                    this.ref.dot.style.borderRadius = borderRadius;
                }
            }
        } else {
            // Not snapped
            if (this.currentState === 'magnetic') {
                // Revert to default or text
                this._snappedTarget = null;

                // If we have a hover text, revert to that, otherwise default
                if (textHoverEl) {
                    this.currentState = 'text';
                    this.element.setAttribute('data-cursor-state', 'text');
                } else {
                    this.currentState = 'default';
                    this.element.setAttribute('data-cursor-state', 'default');
                }

                // Clear inline styles
                if (this.ref.dot) {
                    this.ref.dot.style.width = '';
                    this.ref.dot.style.height = '';
                    this.ref.dot.style.marginLeft = '';
                    this.ref.dot.style.marginTop = '';
                    this.ref.dot.style.borderRadius = '';
                }
            }
        }
    }

    render(time) {
        if (!this._isRenderingFrame) return;

        if (this._needsAllBoundsUpdate) {
            this._needsAllBoundsUpdate = false;

            // Rebuild the cache of all magnetic elements
            const elements = document.querySelectorAll('[data-magnetic]');
            this.cachedMagneticElements = [];

            // DEFERRED BOUNDS CALCULATION: Calculates bounds without synchronous layout thrashing
            for (const el of elements) {
                // If it's the current target, we need to mathematically untransform it
                let rect = el.getBoundingClientRect();

                let left = rect.left;
                let top = rect.top;
                let width = rect.width;
                let height = rect.height;

                if (el === this.magneticTarget) {
                    left -= this._currentPullX;
                    top -= this._currentPullY;
                }

                const bounds = {
                    left: left,
                    top: top,
                    right: left + width,
                    bottom: top + height,
                    width: width,
                    height: height,
                    centerX: left + width / 2,
                    centerY: top + height / 2
                };

                this.cachedMagneticElements.push({ el, bounds });

                if (el === this.magneticTarget) {
                    this.magneticBounds = bounds;
                }
            }
        }

        // Calculate delta time for frame-rate independent lerp
        // Cap deltaTime to 100ms to avoid huge jumps on tab switch
        const deltaTime = Math.min(time - this._lastTime, 100);
        this._lastTime = time;

        // timeScale normalizes delta against a standard 60fps frame (16.66ms)
        const timeScale = deltaTime / 16.666;

        let targetX = this.mouse.x;
        let targetY = this.mouse.y;

        // If hovering magnetic element, pull the target to its center
        if (this.magneticTarget && this.magneticBounds) {
            const pullX = (this.mouse.x - this.magneticBounds.centerX) * this.options.magneticStrength;
            const pullY = (this.mouse.y - this.magneticBounds.centerY) * this.options.magneticStrength;

            // Only snap the cursor target to the element if actually snapped
            if (this.currentState === 'magnetic') {
                targetX = this.magneticBounds.centerX + pullX;
                targetY = this.magneticBounds.centerY + pullY;
            }

            this._currentPullX = pullX;
            this._currentPullY = pullY;

            // Also move the magnetic element itself slightly towards the mouse
            const magneticTransformStr = `translate3d(${pullX.toFixed(4)}px, ${pullY.toFixed(4)}px, 0px)`;
            if (this._lastMagneticTransform !== magneticTransformStr) {
                this.magneticTarget.style.transform = magneticTransformStr;
                this._lastMagneticTransform = magneticTransformStr;
            }
        }

        // Frame-rate independent exponential smoothing
        // Math.pow(1 - friction, timeScale) calculates remaining distance
        const interpolationFactor = 1 - Math.pow(1 - this.options.friction, timeScale);

        this.cursor.x += (targetX - this.cursor.x) * interpolationFactor;
        this.cursor.y += (targetY - this.cursor.y) * interpolationFactor;

        // Apply to DOM
        if (this.ref.dot) {
            const dotTransformStr = `translate3d(${this.cursor.x.toFixed(4)}px, ${this.cursor.y.toFixed(4)}px, 0px)`;
            if (this._lastDotTransform !== dotTransformStr) {
                this.ref.dot.style.transform = dotTransformStr;
                this._lastDotTransform = dotTransformStr;
            }
        }

        // Check if cursor has essentially reached the mouse to put loop to sleep
        const dx = targetX - this.cursor.x;
        const dy = targetY - this.cursor.y;

        // Use squared distance for performance (avoids Math.sqrt)
        const distSq = dx * dx + dy * dy;

        if (distSq < 0.01) {
            // Snap exactly and sleep
            this.cursor.x = targetX;
            this.cursor.y = targetY;
            if (this.ref.dot) {
                const dotTransformStr = `translate3d(${this.cursor.x.toFixed(4)}px, ${this.cursor.y.toFixed(4)}px, 0px)`;
                if (this._lastDotTransform !== dotTransformStr) {
                    this.ref.dot.style.transform = dotTransformStr;
                    this._lastDotTransform = dotTransformStr;
                }
            }
            this._isRenderingFrame = false;
        } else {
            // Keep rendering
            this._rafId = requestAnimationFrame(this.render);
        }
    }
}

gia.register(CustomCursor);

/*
========================================
EXPECTED HTML
========================================

<!-- Place this outside your main content wrapper near the body tag -->
<div class="custom-cursor" data-component="CustomCursor" data-cursor-state="default">
    <div class="custom-cursor__dot" data-ref="CustomCursor:dot">
        <span class="custom-cursor__text" data-ref="CustomCursor:text"></span>
    </div>
</div>

<!-- Example Usage in Content -->
<article class="news-card" data-hover-text="Read more">
    <h3>Article Title</h3>
    <p>Some excerpt...</p>
</article>

<nav>
    <a href="#" class="social-icon" data-magnetic>
        <svg>...</svg>
    </a>
</nav>

========================================
SUGGESTED SCSS
========================================

// Hide default cursor globally if desired,
// but ensure it's still accessible for users without JS
@media (pointer: fine) {
    body {
        cursor: none;

        // Important: ensure interactive elements also hide cursor
        // to prevent flickering when hovering
        a, button, [data-magnetic], [data-hover-text] {
            cursor: none;
        }
    }
}

.custom-cursor {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; // Crucial: let clicks pass through
    z-index: 9999;

    // Hide on mobile / touch devices
    @media (hover: none) and (pointer: coarse) {
        display: none;
    }
}

.custom-cursor__dot {
    position: absolute;
    top: 0;
    left: 0;
    width: 20px;
    height: 20px;
    margin-left: -10px; // Center the dot on the cursor coordinates
    margin-top: -10px;
    border-radius: 50%;
    background-color: var(--color-primary, #000);
    display: flex;
    align-items: center;
    justify-content: center;

    // Animate state changes (size, color, etc), NOT position!
    transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                height 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                background-color 0.3s ease,
                margin 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                border-radius 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    will-change: transform, width, height;
}

.custom-cursor__text {
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    opacity: 0;
    white-space: nowrap;
    transition: opacity 0.2s ease;
}

// ----------------------------------------
// States
// ----------------------------------------

[data-cursor-state="text"] {
    .custom-cursor__dot {
        width: 100px;
        height: 100px;
        margin-left: -50px;
        margin-top: -50px;
        background-color: rgba(0, 0, 0, 0.8);
    }

    .custom-cursor__text {
        opacity: 1;
        transition-delay: 0.1s;
    }
}

[data-cursor-state="magnetic"] {
    .custom-cursor__dot {
        background-color: transparent;
        border: 2px solid var(--color-primary, #000);
    }
}

// ----------------------------------------
// Magnetic Element Styles
// ----------------------------------------

[data-magnetic] {
    display: inline-block;
    // Bouncy return transition when cursor leaves
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    will-change: transform;

    &.is-magnetic-active {
        // Remove transition while actively following mouse
        transition: none;
    }
}
*/
