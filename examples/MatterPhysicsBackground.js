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
            restitution: 0.8
        };

        this.state = {
            isPaused: false
        };

        // Matter.js references
        this.engine = null;
        this.render = null;
        this.runner = null;
        this.mouseConstraint = null;

        this.width = 0;
        this.height = 0;
        this.isVisible = false;

        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    async require() {
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

        // Observers
        this.observeResize(this.element, this.handleResize);
        this.observeIntersection(this.element, this.handleIntersection, { threshold: 0 });

        this.updateRunnerState();
    }

    unmount() {
        if (this.ref.canvas) {
            this.ref.canvas.removeEventListener('mousedown', this.handlePointerDown);
            this.ref.canvas.removeEventListener('touchstart', this.handlePointerDown);
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
        const { Bodies, Composite } = window.Matter;
        const s = this.options.shapeSize;
        const isCircle = Math.random() > 0.5;

        // Random pastel colors
        const hue = Math.floor(Math.random() * 360);
        const fillStyle = `hsl(${hue}, 70%, 60%)`;

        let body;
        if (isCircle) {
            body = Bodies.circle(x, y, s / 2 + Math.random() * 10, {
                restitution: this.options.restitution,
                density: this.options.density,
                render: { fillStyle }
            });
        } else {
            body = Bodies.rectangle(x, y, s + Math.random() * 20, s + Math.random() * 20, {
                restitution: this.options.restitution,
                density: this.options.density,
                render: { fillStyle }
            });
        }

        Composite.add(this.engine.world, body);
    }

    handlePointerDown(e) {
        // Only spawn if we aren't dragging an existing object
        if (this.mouseConstraint && this.mouseConstraint.body) return;

        // Get relative coordinates
        const rect = this.ref.canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        this._addRandomShape(x, y);
    }

    handleResize(entries) {
        const entry = entries[0];
        this.width = entry.contentRect.width;
        this.height = entry.contentRect.height;

        if (this.render) {
            this.render.canvas.width = this.width * window.devicePixelRatio;
            this.render.canvas.height = this.height * window.devicePixelRatio;
            this.render.options.width = this.width;
            this.render.options.height = this.height;
            this.render.bounds.max.x = this.width;
            this.render.bounds.max.y = this.height;
        }

        this._createWalls();
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
