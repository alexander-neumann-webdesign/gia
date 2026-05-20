class MatterPhysicsBackground extends gia.Component {
    constructor(element) {
        super(element);

        this.ref = {
            canvas: null
        };

        this.options = {
            shapeSize: 40,
            wallThickness: 60,
            density: 0.04,
            restitution: 0.8,
            cursorSize: 20
        };

        this.handleBodyResize = this.handleBodyResize.bind(this);

        this.setState({
            isPaused: false
        });

        // Matter.js references
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.mouseConstraint = null;

        this.width = 0;
        this.height = 0;
        this.isVisible = false;

        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerLeave = this.handlePointerLeave.bind(this);
    }

    async require() {
        // Delay initialization until the container is near the viewport
        // and the main thread is idle (meaning other components have initialized)
        await new Promise(resolve => {
            const initWhenIdle = () => {
				if ('requestIdleCallback' in window) {
					window.requestIdleCallback(resolve);
				} else {
					setTimeout(resolve, 0);
				}
			};

            const intersectionCallback = (entries) => {
                if (entries[0].isIntersecting) {
                    // We only need to wait for the first intersection to resolve require()
                    this.unobserveIntersection(this.element, intersectionCallback);
                    initWhenIdle();
                }
            };
            this.observeIntersection(this.element, intersectionCallback);
        });

        // Load matter.js asynchronously from CDN.
        // It exposes the global 'Matter' variable.
        await this.loadScript('matter-js-script', 'Matter');
    }

    mount() {
        if (!this.ref.canvas) {
            console.error('MatterPhysicsBackground requires a canvas element ref.');
            return;
        }

        if (typeof window.Matter === 'undefined') {
            console.error('Matter.js failed to load.');
            return;
        }

        const { Engine, Render, Runner, Mouse, MouseConstraint, World, Bodies, Composite } = window.Matter;

        // Initialize state
        this.setState({ isPaused: this.prefersReducedMotion });

        // create engine
        this.engine = Engine.create();

        // Disable gravity on load, maybe add it interactively later or keep it low
        this.engine.world.gravity.y = 1;

        // Get initial dimensions
        const rect = this.element.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.offsetLeft = rect.left + window.scrollX;
        this.offsetTop = rect.top + window.scrollY;

        // create renderer
        this.render = Render.create({
            element: this.element,
            engine: this.engine,
            canvas: this.ref.canvas,
            options: {
                width: this.width,
                height: this.height,
                background: 'transparent',
                wireframes: false,
                pixelRatio: window.devicePixelRatio
            }
        });

        Render.run(this.render);

        // create runner
        this.runner = Runner.create();

        // Add walls
        this._createWalls();

        // Add some initial bodies
        for (let i = 0; i < 20; i++) {
            this._addRandomShape(
                Math.random() * this.width,
                (Math.random() * this.height) / 2
            );
        }

        // add mouse control
        const mouse = Mouse.create(this.render.canvas);

        this.cursorBody = Bodies.circle(-1000, -1000, this.options.cursorSize, {
            isStatic: true,
            render: { visible: false }
        });
        Composite.add(this.engine.world, this.cursorBody);

        // Matter.js automatically binds a wheel event listener that calls e.preventDefault(),
        // which prevents page scrolling. We remove it here because we don't need zoom/scroll physics.
        this.render.canvas.removeEventListener('wheel', mouse.mousewheel);
        this.render.canvas.removeEventListener('mousewheel', mouse.mousewheel);
        this.render.canvas.removeEventListener('DOMMouseScroll', mouse.mousewheel);

        this.mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: {
                    visible: false
                }
            }
        });

        Composite.add(this.engine.world, this.mouseConstraint);

        // keep the mouse in sync with rendering
        this.render.mouse = mouse;

        // Add click to create shapes
        this.ref.canvas.addEventListener('mousedown', this.handlePointerDown);
        this.ref.canvas.addEventListener('touchstart', this.handlePointerDown, { passive: true });

        // Add hover to repel shapes
        this.ref.canvas.addEventListener('mousemove', this.handlePointerMove);
        this.ref.canvas.addEventListener('touchmove', this.handlePointerMove, { passive: true });
        this.ref.canvas.addEventListener('mouseleave', this.handlePointerLeave);
        this.ref.canvas.addEventListener('touchend', this.handlePointerLeave);
        this.ref.canvas.addEventListener('touchcancel', this.handlePointerLeave);

        // Observers
        this.observeResize(this.element, this.handleResize);
        this.observeResize(document.body, this.handleBodyResize);
        this.observeIntersection(this.element, this.handleIntersection, { threshold: 0 });

        this.updateRunnerState();
    }

    unmount() {
        if (this.ref.canvas) {
            this.ref.canvas.removeEventListener('mousedown', this.handlePointerDown);
            this.ref.canvas.removeEventListener('touchstart', this.handlePointerDown);
            this.ref.canvas.removeEventListener('mousemove', this.handlePointerMove);
            this.ref.canvas.removeEventListener('touchmove', this.handlePointerMove);
            this.ref.canvas.removeEventListener('mouseleave', this.handlePointerLeave);
            this.ref.canvas.removeEventListener('touchend', this.handlePointerLeave);
            this.ref.canvas.removeEventListener('touchcancel', this.handlePointerLeave);
        }

        if (this.render) {
            window.Matter.Render.stop(this.render);
            this.render.canvas.remove();
            this.render.canvas = null;
            this.render.context = null;
            this.render.textures = {};
        }

        if (this.runner) {
            window.Matter.Runner.stop(this.runner);
        }

        if (this.engine) {
            window.Matter.World.clear(this.engine.world);
            window.Matter.Engine.clear(this.engine);
        }
    }

    _createWalls() {
        const { Bodies, Composite } = window.Matter;
        const w = this.width;
        const h = this.height;
        const t = this.options.wallThickness;
        const opts = { isStatic: true, render: { fillStyle: 'transparent' } };

        // Remove old walls if they exist
        if (this.walls) {
            Composite.remove(this.engine.world, this.walls);
        }

        this.walls = [
            Bodies.rectangle(w / 2, -t / 2, w + t * 2, t, opts), // top
            Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, opts), // bottom
            Bodies.rectangle(w + t / 2, h / 2, t, h + t * 2, opts), // right
            Bodies.rectangle(-t / 2, h / 2, t, h + t * 2, opts) // left
        ];

        Composite.add(this.engine.world, this.walls);
    }

    _addRandomShape(x, y) {
        const { Bodies, Body, Composite } = window.Matter;
        const s = this.options.shapeSize;
        const rand = Math.random();

        // Random pastel colors
        const hue = Math.floor(Math.random() * 360);
        const fillStyle = `hsl(${hue}, 70%, 60%)`;

        const options = {
            restitution: this.options.restitution,
            density: this.options.density,
            render: { fillStyle }
        };

        let body;
        if (rand < 0.33) {
            body = Bodies.circle(x, y, s / 2 + Math.random() * 10, options);
        } else if (rand < 0.66) {
            body = Bodies.rectangle(x, y, s + Math.random() * 20, s + Math.random() * 20, options);
        } else {
            const sides = Math.floor(Math.random() * 4) + 3; // 3 to 6 sides
            body = Bodies.polygon(x, y, sides, s / 2 + Math.random() * 10, options);
        }

        // Add random initial velocity and angular velocity for a burst effect
        Body.setVelocity(body, {
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 20
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.5);

        Composite.add(this.engine.world, body);
    }

    handlePointerDown(e) {
        // Only spawn if we aren't dragging an existing object
        if (this.mouseConstraint && this.mouseConstraint.body) return;

        // Get relative coordinates using cached bounds
        let pageX, pageY;

        if (e.touches && e.touches.length > 0) {
            pageX = e.touches[0].pageX;
            pageY = e.touches[0].pageY;
        } else {
            pageX = e.pageX;
            pageY = e.pageY;
        }

        const x = pageX - this.offsetLeft;
        const y = pageY - this.offsetTop;

        this._addRandomShape(x, y);
    }

    handlePointerMove(e) {
        // Skip if physics is paused or no engine
        if (!this.engine || this.state.isPaused) return;

        // Get relative coordinates using cached bounds
        let pageX, pageY;

        if (e.touches && e.touches.length > 0) {
            pageX = e.touches[0].pageX;
            pageY = e.touches[0].pageY;
        } else {
            pageX = e.pageX;
            pageY = e.pageY;
        }

        const mouseX = pageX - this.offsetLeft;
        const mouseY = pageY - this.offsetTop;

        if (this.cursorBody) {
            window.Matter.Body.setPosition(this.cursorBody, { x: mouseX, y: mouseY });
        }
    }

    handlePointerLeave() {
        if (this.cursorBody) {
            window.Matter.Body.setPosition(this.cursorBody, { x: -1000, y: -1000 });
        }
    }

    handleResize(entries) {
        const entry = entries[0];
        this.width = entry.contentRect.width;
        this.height = entry.contentRect.height;

        const rect = this.element.getBoundingClientRect();
        this.offsetLeft = rect.left + window.scrollX;
        this.offsetTop = rect.top + window.scrollY;

        if (this.render) {
            this.render.canvas.width = this.width * window.devicePixelRatio;
            this.render.canvas.height = this.height * window.devicePixelRatio;
            this.render.canvas.style.width = this.width + 'px';
            this.render.canvas.style.height = this.height + 'px';
            this.render.options.width = this.width;
            this.render.options.height = this.height;
            this.render.bounds.max.x = this.width;
            this.render.bounds.max.y = this.height;
        }

        this._createWalls();
    }

    handleBodyResize() {
        const rect = this.element.getBoundingClientRect();
        this.offsetLeft = rect.left + window.scrollX;
        this.offsetTop = rect.top + window.scrollY;
    }

    handleIntersection(entries) {
        const entry = entries[0];
        this.isVisible = entry.isIntersecting;
        this.updateRunnerState();
    }

    stateChange(stateChanges) {
        if ('isPaused' in stateChanges) {
            this.updateRunnerState();

            // Allow external pause button to control state if it exists
            const pauseToggle = this.element.querySelector('[data-action="click->togglePause"]');
            if (pauseToggle) {
                pauseToggle.setAttribute('aria-expanded', this.state.isPaused);
            }
        }
    }

    togglePause() {
        this.setState({ isPaused: !this.state.isPaused });
    }

    updateRunnerState() {
        if (!this.runner) return;

        if (this.isVisible && !this.state.isPaused) {
            window.Matter.Runner.start(this.runner, this.engine);
        } else {
            window.Matter.Runner.stop(this.runner);
        }
    }
}

gia.register(MatterPhysicsBackground);

/*
========================================
EXPECTED HTML
========================================

<section class="physics-section" data-component="MatterPhysicsBackground">
    <!-- The canvas sits in the background -->
    <canvas class="physics-canvas" data-ref="MatterPhysicsBackground:canvas" aria-hidden="true"></canvas>

    <!-- Content overlay -->
    <div class="physics-content">
        <h2>Physics Background</h2>
        <p>Powered by Matter.js. Click anywhere to drop shapes!</p>

        <button type="button" class="btn" data-action="click->togglePause">
            Toggle Physics
        </button>
    </div>
</section>

========================================
SUGGESTED SCSS
========================================

.physics-section {
    position: relative;
    width: 100%;
    min-height: 60vh;
    overflow: hidden;
    background-color: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;

    // The container receives pointer events
    touch-action: none; // Prevent scrolling when dragging shapes
}

.physics-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;

    // allow canvas to intercept mouse events for Matter.js MouseConstraint
    pointer-events: auto;
}

.physics-content {
    position: relative;
    z-index: 10;
    text-align: center;
    pointer-events: none; // Let events pass through to canvas
    background: rgba(255, 255, 255, 0.8);
    padding: 2rem;
    border-radius: 1rem;
    backdrop-filter: blur(8px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

    // Re-enable pointer events on interactive children
    * {
        pointer-events: auto;
    }
}
*/
