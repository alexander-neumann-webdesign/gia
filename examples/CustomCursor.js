class CustomCursor extends gia.Component {
    constructor(element) {
        super(element);

        this.options = {
            friction: 0.8, // The lerp friction. Lower = slower. 0.8 is quite responsive
            magneticStrength: 0.3 // How much the magnetic element is pulled towards the mouse
        };

        this.ref = {
            dot: null, // The main cursor dot
            text: null // The text container inside the cursor
        };

        // Pre-bind methods for performance in requestAnimationFrame and event listeners
        this.render = this.render.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleScroll = this.handleScroll.bind(this);

        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

        // For magnetic target
        this.magneticTarget = null;
        this.magneticBounds = null;

        // Current visual state
        this.currentState = 'default';
        this.currentText = '';

        // Animation loop control
        this._isRenderingFrame = false;
        this._needsBoundsUpdate = false;
        this._lastTime = performance.now();

        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    mount() {
        if (this.prefersReducedMotion) {
            // If user prefers reduced motion, disable friction for instant snapping
            this.options.friction = 1;
        }

        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        window.addEventListener('scroll', this.handleScroll, { passive: true });

        // Start the render loop initially
        this._lastTime = performance.now();
        this._isRenderingFrame = true;
        requestAnimationFrame(this.render);
    }

    unmount() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('scroll', this.handleScroll);
        this._isRenderingFrame = false;

        // Reset any currently active magnetic element
        if (this.magneticTarget) {
            this.magneticTarget.style.transform = '';
            this.magneticTarget.classList.remove('is-magnetic-active');
            this.magneticTarget = null;
        }
    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;

        // Wake up render loop if asleep
        if (!this._isRenderingFrame) {
            this._lastTime = performance.now();
            this._isRenderingFrame = true;
            requestAnimationFrame(this.render);
        }

        // Process interactions via event delegation
        this._processInteractions(e.target);
    }

    handleScroll() {
        // Scroll can change relative positions, so wake up the loop
        if (!this._isRenderingFrame) {
            this._lastTime = performance.now();
            this._isRenderingFrame = true;
            requestAnimationFrame(this.render);
        }

        // Re-evaluate magnetic bounds on scroll if active
        if (this.magneticTarget) {
            this._needsBoundsUpdate = true;
        }
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

        // Magnetic Hover
        const magneticEl = target.closest('[data-magnetic]');

        if (magneticEl && this.magneticTarget !== magneticEl) {
            // Enter new magnetic element
            if (this.magneticTarget) {
                // Cleanup previous
                this.magneticTarget.style.transform = '';
                this.magneticTarget.classList.remove('is-magnetic-active');
            }

            this.magneticTarget = magneticEl;
            this.magneticTarget.classList.add('is-magnetic-active');

            // Calculate true center without existing transforms
            const currentTransform = this.magneticTarget.style.transform;
            this.magneticTarget.style.transform = 'translate3d(0px, 0px, 0px)';

            const rect = this.magneticTarget.getBoundingClientRect();
            this.magneticBounds = {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
            };

            this.magneticTarget.style.transform = currentTransform;

            if (this.currentState !== 'magnetic') {
                this.currentState = 'magnetic';
                this.element.setAttribute('data-cursor-state', 'magnetic');
            }

        } else if (!magneticEl && this.magneticTarget) {
            // Exit magnetic element
            this.magneticTarget.style.transform = '';
            this.magneticTarget.classList.remove('is-magnetic-active');
            this.magneticTarget = null;
            this.magneticBounds = null;

            if (this.currentState === 'magnetic') {
                this.currentState = 'default';
                this.element.setAttribute('data-cursor-state', 'default');
            }
        }
    }

    render(time) {
        if (!this._isRenderingFrame) return;

        if (this._needsBoundsUpdate && this.magneticTarget) {
            this._needsBoundsUpdate = false;
            // To properly calculate the original bounds during scroll without transform interference
            const currentTransform = this.magneticTarget.style.transform;
            this.magneticTarget.style.transform = 'translate3d(0px, 0px, 0px)';

            const rect = this.magneticTarget.getBoundingClientRect();
            this.magneticBounds = {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
            };

            // Restore transform
            this.magneticTarget.style.transform = currentTransform;
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

            targetX = this.magneticBounds.centerX + pullX;
            targetY = this.magneticBounds.centerY + pullY;

            // Also move the magnetic element itself slightly towards the mouse
            this.magneticTarget.style.transform = `translate3d(${pullX}px, ${pullY}px, 0px)`;
        }

        // Frame-rate independent exponential smoothing
        // Math.pow(1 - friction, timeScale) calculates remaining distance
        const interpolationFactor = 1 - Math.pow(1 - this.options.friction, timeScale);

        this.cursor.x += (targetX - this.cursor.x) * interpolationFactor;
        this.cursor.y += (targetY - this.cursor.y) * interpolationFactor;

        // Apply to DOM
        if (this.ref.dot) {
            this.ref.dot.style.transform = `translate3d(${this.cursor.x}px, ${this.cursor.y}px, 0px)`;
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
                this.ref.dot.style.transform = `translate3d(${this.cursor.x}px, ${this.cursor.y}px, 0px)`;
            }
            this._isRenderingFrame = false;
        } else {
            // Keep rendering
            requestAnimationFrame(this.render);
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
                margin 0.3s cubic-bezier(0.25, 1, 0.5, 1);
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
        width: 40px;
        height: 40px;
        margin-left: -20px;
        margin-top: -20px;
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
