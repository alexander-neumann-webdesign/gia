class CustomCursor extends gia.Component {
    constructor(element) {
        super(element);

        this.options = {
            friction: 0.8, // The lerp friction. Lower = slower. 0.8 is quite responsive
            magneticStrength: 0.3, // How much the magnetic element is pulled towards the mouse
            magneticPadding: 40, // The extended magnetic zone beyond the element bounds
            skewing: 3, // Amount of skew based on velocity
            skewingText: 0, // Skew amount when in text state (usually 0 to keep text readable)
            skewingIcon: 0,
            skewingMedia: 0
        };

        this.ref = {
            dot: null, // The main cursor dot
            text: null, // The text container inside the cursor
            mediaBox: null, // The media wrapper
            icon: null // The icon container
        };

        // Pre-bind methods for performance in requestAnimationFrame and event listeners

        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.cursor = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.scroll = { x: typeof window !== 'undefined' ? (window.scrollX || window.pageXOffset) : 0, y: typeof window !== 'undefined' ? (window.scrollY || window.pageYOffset) : 0 };

        // For magnetic target
        this.magneticTarget = null;
        this.magneticBounds = null;

        // Cache of all magnetic elements to avoid layout thrashing during mousemove
        this.cachedMagneticElements = [];

        // Current visual state
        this.currentState = 'default';
        this.currentText = '';
        this.currentImg = '';
        this.currentVideo = '';
        this.currentIcon = '';

        // Velocity & Skew
        this._lastPos = { x: this.cursor.x, y: this.cursor.y };
        this._velocity = { x: 0, y: 0 };
        this._skewAngle = 0;
        this._skewIntensity = 0;

        // Animation loop control
        this._rafId = null;
        this._isRenderingFrame = false;
        this._lastTime = performance.now();
        this._lastDotTransform = '';
        this._lastMagneticTransform = '';
        this._currentPullX = 0;
        this._currentPullY = 0;

        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Observers to keep bounds up to date
        this.resizeObserver = null;
        this.mutationObserver = null;

        // Preloaded images cache
        this.preloadedImages = new Set();
    }

    mount() {
        if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) {
            return;
        }

        if (this.prefersReducedMotion) {
            // If user prefers reduced motion, disable friction for instant snapping
            this.options.friction = 1;
        }

        window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        this.observeScroll(this.handleScroll);
        this.observeWindowResize(this.handleResize);

        // Setup observers to trigger bounds updates
        this.observeResize(document.body, this.handleResize);

        if (window.MutationObserver) {
            this.mutationObserver = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                for (let i = 0; i < mutations.length; i++) {
                    const mutation = mutations[i];
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        shouldUpdate = true;
                        break;
                    }
                }
                if (shouldUpdate) {
                    // ⚡ BOLT OPTIMIZATION: Call _updateBounds synchronously here instead of deferring
                    // via a boolean flag to prevent layout thrashing in the requestAnimationFrame loop.
                    this._updateBounds();
                    this._wakeUp();
                }
            });
            this.mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-magnetic', 'data-cursor-stick', 'data-cursor-img', 'class'] });
        }

        // Ensure bounds are calculated before starting the render loop
        this._updateBounds();

        // Start the render loop initially
        this._lastTime = performance.now();
        this._isRenderingFrame = true;
        this._rafId = requestAnimationFrame(this.render);
    }

    unmount() {
        window.removeEventListener('mousemove', this.handleMouseMove);
        this.unobserveScroll(this.handleScroll);
        this.unobserveWindowResize(this.handleResize);

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

    handleScroll(payload) {
        this.scroll.x = window.scrollX || window.pageXOffset;
        this.scroll.y = payload ? payload.scroll : (window.scrollY || window.pageYOffset);
        this._wakeUp();
    }

    handleResize() {
        // ⚡ BOLT OPTIMIZATION: Call _updateBounds synchronously here instead of deferring
        // via a boolean flag to prevent layout thrashing in the requestAnimationFrame loop.
        this._updateBounds();
        this._wakeUp();
    }

    _updateTargetState(target) {
        if (this._lastInteractionTarget !== target) {
            this._lastInteractionTarget = target;

            // ⚡ BOLT OPTIMIZATION: Combine multiple target.closest() calls into a single query
            // to drastically reduce synchronous DOM traversals during high-frequency mousemove events.
            const interactiveEl = target.closest('[data-hover-text], [data-cursor-text], [data-cursor-icon], [data-cursor-img], [data-cursor-video]');

            this._cachedTargetState = 'default';
            this._cachedTargetText = '';
            this._cachedTargetIcon = '';
            this._cachedTargetImg = '';
            this._cachedTargetVideo = '';

            if (interactiveEl) {
                if (interactiveEl.hasAttribute('data-cursor-img')) {
                    this._cachedTargetState = 'media';
                    this._cachedTargetImg = interactiveEl.getAttribute('data-cursor-img');
                } else if (interactiveEl.hasAttribute('data-cursor-video')) {
                    this._cachedTargetState = 'media';
                    this._cachedTargetVideo = interactiveEl.getAttribute('data-cursor-video');
                } else if (interactiveEl.hasAttribute('data-cursor-icon')) {
                    this._cachedTargetState = 'icon';
                    this._cachedTargetIcon = interactiveEl.getAttribute('data-cursor-icon');
                } else {
                    this._cachedTargetState = 'text';
                    this._cachedTargetText = interactiveEl.getAttribute('data-hover-text') || interactiveEl.getAttribute('data-cursor-text');
                }
            }
        }
    }

    _findClosestMagneticElement(docMouseX, docMouseY) {
        let closestMagneticEl = null;
        let isSnapped = false;
        let isStick = false;
        let minDistanceSq = Infinity;

        for (let i = 0; i < this.cachedMagneticElements.length; i++) {
            const item = this.cachedMagneticElements[i];
            const { el, bounds, type } = item;

            // ⚡ BOLT OPTIMIZATION: 1D Spatial Partitioning checks.
            // If the element's top bound (minus padding) is below the cursor, all subsequent elements
            // in the sorted array will also be below the cursor. We can safely break the loop early.
            if (bounds.top - this.options.magneticPadding > docMouseY) {
                break;
            }

            // If the element's bottom bound (plus padding) is above the cursor, skip to the next element.
            if (bounds.bottom + this.options.magneticPadding < docMouseY) {
                continue;
            }

            // Check horizontal padded bounds (we already checked vertical via the spatial partitioning above)
            if (
                docMouseX >= bounds.left - this.options.magneticPadding &&
                docMouseX <= bounds.right + this.options.magneticPadding
            ) {
                // Find the closest one by center distance to handle overlapping padded zones
                const dx = docMouseX - bounds.centerX;
                const dy = docMouseY - bounds.centerY;
                const distSq = dx * dx + dy * dy;

                if (distSq < minDistanceSq) {
                    minDistanceSq = distSq;
                    closestMagneticEl = el;
                    this.magneticBounds = bounds;

                    // Check if directly over or very near the element itself
                    isSnapped = (
                        docMouseX >= bounds.left - 5 &&
                        docMouseX <= bounds.right + 5 &&
                        docMouseY >= bounds.top - 5 &&
                        docMouseY <= bounds.bottom + 5
                    );

                    isStick = type === 'stick';
                }
            }
        }

        return { closestMagneticEl, isSnapped, isStick };
    }

    _handleMagneticPullZone(closestMagneticEl) {
        if (closestMagneticEl && this.magneticTarget !== closestMagneticEl) {
            const previousTarget = this.magneticTarget;
            this.magneticTarget = closestMagneticEl;
            this._currentPullX = 0;
            this._currentPullY = 0;
            this._lastMagneticTransform = '';

            gia.mutate(() => {
                if (previousTarget) {
                    previousTarget.style.transform = '';
                    previousTarget.classList.remove('is-magnetic-active');
                }
                closestMagneticEl.classList.add('is-magnetic-active');
            });
        } else if (!closestMagneticEl && this.magneticTarget) {
            const previousTarget = this.magneticTarget;
            this.magneticTarget = null;
            this.magneticBounds = null;
            this._lastMagneticTransform = '';

            gia.mutate(() => {
                previousTarget.style.transform = '';
                previousTarget.classList.remove('is-magnetic-active');
            });
        }
    }

    _updateVisualState(finalState, closestMagneticEl, targetState, targetText, targetImg, targetVideo, targetIcon) {
        if (this.currentState !== finalState || this._snappedTarget !== closestMagneticEl || this.currentText !== targetText || this.currentImg !== targetImg || this.currentVideo !== targetVideo || this.currentIcon !== targetIcon) {
            
            const prevState = this.currentState;
            
            // Update tracking properties immediately so subsequent events don't re-trigger
            this.currentState = finalState;
            this.currentText = targetText;
            this.currentImg = targetImg;
            this.currentVideo = targetVideo;
            this.currentIcon = targetIcon;
            this._snappedTarget = closestMagneticEl;

            gia.mutate(() => {
                // Inline cleanup
                if (prevState === 'media' && targetState !== 'media' && this.ref.mediaBox) {
                    this.ref.mediaBox.replaceChildren();
                }
                if (prevState === 'icon' && targetState !== 'icon' && this.ref.icon) {
                    this.ref.icon.replaceChildren();
                }
                if ((prevState === 'magnetic' || prevState === 'stick') && (finalState !== 'magnetic' && finalState !== 'stick')) {
                    if (this.ref.dot) {
                        this.ref.dot.style.width = '';
                        this.ref.dot.style.height = '';
                        this.ref.dot.style.marginLeft = '';
                        this.ref.dot.style.marginTop = '';
                        this.ref.dot.style.borderRadius = '';
                    }
                }

                // Inline properties
                this.element.setAttribute('data-cursor-state', finalState);

                // DOM Content
                this._updateDOMContent(targetState, targetText, targetImg, targetVideo, targetIcon);

                // Snapping Visuals
                if (finalState === 'magnetic' && this.ref.dot && this.magneticBounds) {
                    const borderRadius = this.magneticBounds.borderRadius;
                    this.ref.dot.style.width = `${this.magneticBounds.width}px`;
                    this.ref.dot.style.height = `${this.magneticBounds.height}px`;
                    this.ref.dot.style.marginLeft = `${-this.magneticBounds.width / 2}px`;
                    this.ref.dot.style.marginTop = `${-this.magneticBounds.height / 2}px`;
                    this.ref.dot.style.borderRadius = borderRadius;
                } else if (finalState === 'stick' && this.ref.dot) {
                    this.ref.dot.style.width = '';
                    this.ref.dot.style.height = '';
                    this.ref.dot.style.marginLeft = '';
                    this.ref.dot.style.marginTop = '';
                    this.ref.dot.style.borderRadius = '';
                }
            });
        }
    }

    _processInteractions(target) {
        // Check states based on attributes
        // Only run expensive DOM traversal if target changed
        this._updateTargetState(target);

        let targetState = this._cachedTargetState;
        let targetText = this._cachedTargetText;
        let targetIcon = this._cachedTargetIcon;
        let targetImg = this._cachedTargetImg;
        let targetVideo = this._cachedTargetVideo;

        // Magnetic and Stick Hover logic
        const scrollX = this.scroll.x;
        const scrollY = this.scroll.y;
        const docMouseX = this.mouse.x + scrollX;
        const docMouseY = this.mouse.y + scrollY;

        const { closestMagneticEl, isSnapped, isStick } = this._findClosestMagneticElement(docMouseX, docMouseY);

        this._handleMagneticPullZone(closestMagneticEl);

        // Determine final target state considering magnetic snapping
        let finalState = targetState;
        if (isSnapped) {
            finalState = isStick ? 'stick' : 'magnetic';
        }

        this._updateVisualState(finalState, closestMagneticEl, targetState, targetText, targetImg, targetVideo, targetIcon);
    }

    _updateDOMContent(targetState, targetText, targetImg, targetVideo, targetIcon) {
        if (targetState === 'text' && this.ref.text) {
            this.ref.text.textContent = targetText || '';
        } else if (targetState === 'media' && this.ref.mediaBox) {
            this.ref.mediaBox.replaceChildren();
            if (targetImg) {
                const img = document.createElement('img');
                img.src = targetImg;
                this.ref.mediaBox.appendChild(img);
            } else if (targetVideo) {
                const vid = document.createElement('video');
                vid.src = targetVideo;
                vid.autoplay = true;
                vid.loop = true;
                vid.muted = true;
                vid.playsInline = true;
                this.ref.mediaBox.appendChild(vid);
            }
        } else if (targetState === 'icon' && this.ref.icon) {
            // Basic SVG use handling; can be customized based on project's icon strategy
            this.ref.icon.replaceChildren();
            if (targetIcon) {
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
                use.setAttribute('href', `#${targetIcon}`);
                svg.appendChild(use);
                this.ref.icon.appendChild(svg);
            }
        }
    }

    _preloadImages() {
        const imageElements = document.querySelectorAll('[data-cursor-img]');
        for (let i = 0; i < imageElements.length; i++) {
            const el = imageElements[i];
            const src = el.getAttribute('data-cursor-img');
            if (src && !this.preloadedImages.has(src)) {
                this.preloadedImages.add(src);
                const img = new Image();
                img.src = src;
            }
        }
    }

    render(time) {
        if (!this._isRenderingFrame) return;



        // Calculate delta time for frame-rate independent lerp
        // Cap deltaTime to 100ms to avoid huge jumps on tab switch
        const deltaTime = Math.min(time - this._lastTime, 100);
        this._lastTime = time;

        // timeScale normalizes delta against a standard 60fps frame (16.66ms)
        const timeScale = deltaTime / 16.666;

        let targetX = this.mouse.x;
        let targetY = this.mouse.y;

        // If hovering magnetic element, pull the target to its center
        const magneticPull = this._calculateMagneticPull(targetX, targetY);
        targetX = magneticPull.targetX;
        targetY = magneticPull.targetY;

        // Frame-rate independent exponential smoothing
        // Math.pow(1 - friction, timeScale) calculates remaining distance
        const interpolationFactor = 1 - Math.pow(1 - this.options.friction, timeScale);

        this.cursor.x += (targetX - this.cursor.x) * interpolationFactor;
        this.cursor.y += (targetY - this.cursor.y) * interpolationFactor;

        // Calculate Skew based on velocity
        const skewStr = this._calculateSkew(interpolationFactor);

        // Apply to DOM
        this._applyDOMTransform(skewStr);

        // Check if cursor has essentially reached the mouse to put loop to sleep
        this._checkSleep(targetX, targetY);
    }

    _calculateElementBounds(el, scrollX, scrollY) {
        let rect = el.getBoundingClientRect();

        let left = rect.left + scrollX;
        let top = rect.top + scrollY;
        let width = rect.width;
        let height = rect.height;

        if (el === this.magneticTarget) {
            left -= this._currentPullX;
            top -= this._currentPullY;
        }

        const type = el.hasAttribute('data-cursor-stick') ? 'stick' : 'magnetic';

        const bounds = {
            left: left,
            top: top,
            right: left + width,
            bottom: top + height,
            width: width,
            height: height,
            centerX: left + width / 2,
            centerY: top + height / 2,
            borderRadius: el.dataset.cachedBorderRadius || (el.dataset.cachedBorderRadius = window.getComputedStyle(el).borderRadius || '0px')
        };

        return { bounds, type };
    }

    _updateBounds() {
        gia.measure(() => {
            this._preloadImages();

            // Rebuild the cache of all magnetic elements
            const elements = document.querySelectorAll('[data-magnetic], [data-cursor-stick]');
            this.cachedMagneticElements = [];

            const scrollX = this.scroll.x;
            const scrollY = this.scroll.y;

            // DEFERRED BOUNDS CALCULATION: Calculates bounds without synchronous layout thrashing
            for (let i = 0; i < elements.length; i++) {
                const el = elements[i];
                const { bounds, type } = this._calculateElementBounds(el, scrollX, scrollY);

                this.cachedMagneticElements.push({ el, bounds, type });

                if (el === this.magneticTarget) {
                    this.magneticBounds = bounds;
                }
            }

            // ⚡ BOLT OPTIMIZATION: 1D Spatial Partitioning.
            // Sort elements by their top bound to allow early exit in the high-frequency O(N) loop.
            this.cachedMagneticElements.sort((a, b) => a.bounds.top - b.bounds.top);
        });
    }

    _calculateMagneticPull(targetX, targetY) {
        if (this.magneticTarget && this.magneticBounds) {
            const scrollX = this.scroll.x;
            const scrollY = this.scroll.y;
            const docMouseX = this.mouse.x + scrollX;
            const docMouseY = this.mouse.y + scrollY;

            // Compute distance from mouse to the actual element's edges
            const dxToEdge = Math.max(0, Math.abs(docMouseX - this.magneticBounds.centerX) - this.magneticBounds.width / 2);
            const dyToEdge = Math.max(0, Math.abs(docMouseY - this.magneticBounds.centerY) - this.magneticBounds.height / 2);

            const maxDistToEdge = Math.max(dxToEdge, dyToEdge);

            // Intensity is 1 when inside the element bounds (maxDistToEdge = 0),
            // and approaches 0 as we reach the padding boundary
            let intensity = Math.max(0, 1 - (maxDistToEdge / this.options.magneticPadding));
            // Apply smoothstep to intensity for a more natural, non-linear magnetic falloff
            intensity = intensity * intensity * (3 - 2 * intensity);

            const pullX = (docMouseX - this.magneticBounds.centerX) * this.options.magneticStrength * intensity;

            const pullY = (docMouseY - this.magneticBounds.centerY) * this.options.magneticStrength * intensity;

            // Only snap the cursor target to the element if actually snapped (magnetic or stick)
            if (this.currentState === 'magnetic') {
                targetX = (this.magneticBounds.centerX - scrollX) + pullX;
                targetY = (this.magneticBounds.centerY - scrollY) + pullY;
            } else if (this.currentState === 'stick') {
                // Parallax effect for stick: let the cursor follow the mouse slightly more than the element
                const dx = docMouseX - this.magneticBounds.centerX;
                const dy = docMouseY - this.magneticBounds.centerY;
                targetX = (this.magneticBounds.centerX - scrollX) + pullX + (dx - pullX) * 0.2; // parallax effect
                targetY = (this.magneticBounds.centerY - scrollY) + pullY + (dy - pullY) * 0.2; // parallax effect
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
        return { targetX, targetY };
    }

    _calculateSkew(interpolationFactor) {
        let skewStr = '';
        if (this.options.skewing) {
            // Determine active skew multiplier based on state
            let skewMultiplier = this.options.skewing;
            if (this.currentState === 'text') skewMultiplier = this.options.skewingText;
            else if (this.currentState === 'icon') skewMultiplier = this.options.skewingIcon;
            else if (this.currentState === 'media') skewMultiplier = this.options.skewingMedia;

            if (skewMultiplier > 0 && this.currentState !== 'magnetic' && this.currentState !== 'stick') {
                this._velocity.x = (this.cursor.x - this._lastPos.x);
                this._velocity.y = (this.cursor.y - this._lastPos.y);

                const distance = Math.sqrt(this._velocity.x * this._velocity.x + this._velocity.y * this._velocity.y);

                // Calculate Skew angle
                if (distance > 0) {
                    this._skewAngle = Math.atan2(this._velocity.y, this._velocity.x);
                }

                // Calculate Skew Intensity (cap at max)
                const targetSkewIntensity = Math.min(distance * 0.5, 30) * skewMultiplier;

                // Lerp skew intensity for smoothness
                this._skewIntensity += (targetSkewIntensity - this._skewIntensity) * interpolationFactor;

                if (Math.abs(this._skewIntensity) > 0.1) {
                    // We apply rotation then scale.
                    // e.g. skewing visually distorts the circle into an ellipse in the direction of motion
                    // We can rotate to the direction of velocity, then scale down the Y and up the X
                    // Or we can just use skewX / skewY
                    // Here we use rotate + scale to stretch the dot
                    const angleDeg = this._skewAngle * (180 / Math.PI);
                    const scaleX = 1 + (this._skewIntensity * 0.01);
                    const scaleY = Math.max(1 - (this._skewIntensity * 0.01), 0.1);
                    skewStr = ' rotate(' + angleDeg + 'deg) scale(' + scaleX + ', ' + scaleY + ')';
                }
            } else {
                // Decay skew
                this._skewIntensity += (0 - this._skewIntensity) * interpolationFactor;
            }

            this._lastPos.x = this.cursor.x;
            this._lastPos.y = this.cursor.y;
        }
        return skewStr;
    }

    _applyDOMTransform(skewStr) {
        if (this.ref.dot) {
            let dotTransformStr = 'translate3d(' + this.cursor.x + 'px, ' + this.cursor.y + 'px, 0px)';
            if (skewStr) {
                dotTransformStr += skewStr;
            }
            if (this._lastDotTransform !== dotTransformStr) {
                this.ref.dot.style.transform = dotTransformStr;
                this._lastDotTransform = dotTransformStr;
            }
        }
    }

    _checkSleep(targetX, targetY) {
        const dx = targetX - this.cursor.x;
        const dy = targetY - this.cursor.y;

        // Use squared distance for performance (avoids Math.sqrt)
        const distSq = dx * dx + dy * dy;

        // We also need to check if skewIntensity is essentially zero before sleeping
        if (distSq < 0.01 && Math.abs(this._skewIntensity) < 0.1) {
            // Snap exactly and sleep
            this.cursor.x = targetX;
            this.cursor.y = targetY;
            if (this.ref.dot) {
                const dotTransformStr = 'translate3d(' + this.cursor.x + 'px, ' + this.cursor.y + 'px, 0px)';
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
        <div class="custom-cursor__media-box" data-ref="CustomCursor:mediaBox"></div>
        <div class="custom-cursor__icon" data-ref="CustomCursor:icon"></div>
    </div>
</div>

<!-- Example Usage in Content -->
<article class="news-card" data-hover-text="Read more">
    <h3>Article Title</h3>
</article>

<div data-cursor-img="path/to/image.jpg">Hover for image</div>
<div data-cursor-video="path/to/video.mp4">Hover for video</div>
<div data-cursor-icon="icon-id">Hover for icon</div>
<div data-cursor-stick>Stick element</div>

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
