

class PongGame extends gia.Component {
    constructor(element) {
        super(element);

        this.ref = {
            canvas: null,
            playerScoreDisplay: null,
            aiScoreDisplay: null,
            pauseToggle: null
        };

        this.options = {
            paddleWidth: 10,
            paddleHeight: 100,
            ballSize: 10,
            ballSpeed: 5,
            aiSpeed: 4,
            paddlePadding: 20
        };

        this.setState({
            playerScore: 0,
            aiScore: 0,
            isPaused: false
        });

        // Game state
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.playerY = 0;
        this.aiY = 0;
        this.ballX = 0;
        this.ballY = 0;
        this.ballVelocityX = 0;
        this.ballVelocityY = 0;
        this.animationFrameId = null;
        this.isVisible = false;

        // Check for reduced motion preference
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    mount() {
        if (!this.ref.canvas) {
            console.error('PongGame requires a canvas element ref.');
            return;
        }

        this.ctx = this.ref.canvas.getContext('2d', { alpha: false }); // alpha false for performance, we'll draw background manually

        // Initial setup
        this.setState({ isPaused: this.prefersReducedMotion });

        // Use ResizeObserver for responsive canvas sizing
        this.observeResize(this.element, this.handleResize);

        // Also observe body to catch layout shifts from above elements (like Accordions)
        this.observeResize(document.body, this.handleBodyResize);

        // Use IntersectionObserver to pause when off-screen
        this.observeIntersection(this.element, this.handleIntersection, { threshold: 0 });

        // Event listeners (autoBindFunctions ensures 'this' context)
        this.element.addEventListener('pointermove', this.handlePointerMove);

        if (this.ref.pauseToggle) {
            this.ref.pauseToggle.addEventListener('click', this.togglePause);
        }

        // Initialize state
        this.resetBall();
    }

    unmount() {
        this.element.removeEventListener('pointermove', this.handlePointerMove);
        if (this.ref.pauseToggle) {
            this.ref.pauseToggle.removeEventListener('click', this.togglePause);
        }
        this.stopGameLoop();
    }

    handleResize(entries) {
        const entry = entries[0];
        // Cache layout dimensions to avoid getBoundingClientRect in hot paths
        this.width = entry.contentRect.width;
        this.height = entry.contentRect.height;
        this.offsetTop = this.element.getBoundingClientRect().top + window.scrollY;

        // Update canvas size
        this.ref.canvas.width = this.width;
        this.ref.canvas.height = this.height;

        // Reset paddles and ball to new dimensions if they go out of bounds
        this.playerY = Math.min(this.playerY, this.height - this.options.paddleHeight);
        this.aiY = Math.min(this.aiY, this.height - this.options.paddleHeight);

        if (this.ballX > this.width || this.ballY > this.height) {
            this.resetBall();
        }

        this.draw(); // Force a draw on resize even if paused
    }

    handleBodyResize() {
        // Update offsetTop when body size changes (e.g. accordion opens above us)
        this.offsetTop = this.element.getBoundingClientRect().top + window.scrollY;
    }

    handleIntersection(entries) {
        const entry = entries[0];
        this.isVisible = entry.isIntersecting;
        this.updateGameLoopState();
    }

    handlePointerMove(e) {
        let y = e.pageY - this.offsetTop;

        y = y - (this.options.paddleHeight / 2);

        // Clamp to screen bounds
        y = Math.max(0, Math.min(y, this.height - this.options.paddleHeight));
        this.playerY = y;
    }

    togglePause() {
        this.setState({ isPaused: !this.state.isPaused });
    }

    stateChange(stateChanges) {
        if ('isPaused' in stateChanges) {
            this.updateGameLoopState();

            // Update aria labels / button text
            if (this.ref.pauseToggle) {
                const label = this.state.isPaused ? 'Play Background Animation' : 'Pause Background Animation';
                this.ref.pauseToggle.setAttribute('aria-label', label);
                this.ref.pauseToggle.innerHTML = this.state.isPaused
                    ? '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
                    : '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
            }
        }

        if ('playerScore' in stateChanges && this.ref.playerScoreDisplay) {
            this.ref.playerScoreDisplay.textContent = stateChanges.playerScore;
        }

        if ('aiScore' in stateChanges && this.ref.aiScoreDisplay) {
            this.ref.aiScoreDisplay.textContent = stateChanges.aiScore;
        }
    }

    updateGameLoopState() {
        if (this.isVisible && !this.state.isPaused) {
            if (!this.animationFrameId) {
                this.lastTime = performance.now();
                this.gameLoop(this.lastTime);
            }
        } else {
            this.stopGameLoop();
        }
    }

    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    resetBall() {
        this.ballX = this.width / 2;
        this.ballY = this.height / 2;

        // Send ball towards the player who just got scored on (or random at start)
        const dirX = Math.random() > 0.5 ? 1 : -1;
        const dirY = Math.random() > 0.5 ? 1 : -1;

        this.ballVelocityX = this.options.ballSpeed * dirX;
        this.ballVelocityY = (this.options.ballSpeed * 0.75) * dirY;
    }

    gameLoop(currentTime) {
        // Calculate delta time for smooth movement regardless of framerate
        const timeScale = (currentTime - this.lastTime) / 16.666; // Normalize to ~60fps
        this.lastTime = currentTime;

        this.update(timeScale);
        this.draw();

        this.animationFrameId = requestAnimationFrame(this.gameLoop);
    }

    update(timeScale) {
        // Move ball
        this.ballX += this.ballVelocityX * timeScale;
        this.ballY += this.ballVelocityY * timeScale;

        // AI Logic: follow the ball
        const aiCenter = this.aiY + (this.options.paddleHeight / 2);

        // Frame-rate independent exponential smoothing for AI tracking
        const interpolationFactor = 1 - Math.pow(1 - 0.1, timeScale);
        const targetAiY = this.ballY - (this.options.paddleHeight / 2);
        this.aiY += (targetAiY - this.aiY) * interpolationFactor;

        // Apply constant speed limit to AI after exponential smoothing to make it beatable
        const maxMove = this.options.aiSpeed * timeScale;
        const actualMove = this.aiY - (aiCenter - (this.options.paddleHeight / 2));

        if (Math.abs(actualMove) > maxMove) {
            this.aiY = (aiCenter - (this.options.paddleHeight / 2)) + (Math.sign(actualMove) * maxMove);
        }

        // Clamp AI paddle
        this.aiY = Math.max(0, Math.min(this.aiY, this.height - this.options.paddleHeight));

        // Top/Bottom wall collision
        if (this.ballY <= 0 || this.ballY >= this.height - this.options.ballSize) {
            this.ballVelocityY *= -1;
            // Keep ball in bounds
            this.ballY = this.ballY <= 0 ? 0 : this.height - this.options.ballSize;
        }

        // Paddle collision
        const hitPlayer =
            this.ballX <= this.options.paddlePadding + this.options.paddleWidth &&
            this.ballX >= this.options.paddlePadding &&
            this.ballY + this.options.ballSize >= this.playerY &&
            this.ballY <= this.playerY + this.options.paddleHeight;

        const hitAI =
            this.ballX + this.options.ballSize >= this.width - this.options.paddlePadding - this.options.paddleWidth &&
            this.ballX <= this.width - this.options.paddlePadding &&
            this.ballY + this.options.ballSize >= this.aiY &&
            this.ballY <= this.aiY + this.options.paddleHeight;

        if (hitPlayer || hitAI) {
            this.ballVelocityX *= -1;

            // Add some "english" (spin) based on where it hit the paddle
            const paddleY = hitPlayer ? this.playerY : this.aiY;
            const hitFactor = (this.ballY + (this.options.ballSize/2) - (paddleY + (this.options.paddleHeight/2))) / (this.options.paddleHeight/2);

            this.ballVelocityY = hitFactor * this.options.ballSpeed;

            // Increase speed slightly
            this.ballVelocityX *= 1.05;

            // Keep ball out of paddle
            if (hitPlayer) {
                this.ballX = this.options.paddlePadding + this.options.paddleWidth;
            } else {
                this.ballX = this.width - this.options.paddlePadding - this.options.paddleWidth - this.options.ballSize;
            }
        }

        // Scoring
        if (this.ballX < 0) {
            // AI Scored
            this.setState({ aiScore: this.state.aiScore + 1 });
            this.resetBall();
        } else if (this.ballX > this.width) {
            // Player Scored
            this.setState({ playerScore: this.state.playerScore + 1 });
            this.resetBall();
        }
    }

    draw() {
        if (!this.ctx) return;

        // Clear background
        this.ctx.fillStyle = '#111827'; // Dark background
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw center dashed line
        this.ctx.beginPath();
        this.ctx.setLineDash([10, 15]);
        this.ctx.moveTo(this.width / 2, 0);
        this.ctx.lineTo(this.width / 2, this.height);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.fillStyle = '#f3f4f6'; // Light elements

        // Draw Player Paddle
        this.ctx.fillRect(
            this.options.paddlePadding,
            this.playerY,
            this.options.paddleWidth,
            this.options.paddleHeight
        );

        // Draw AI Paddle
        this.ctx.fillRect(
            this.width - this.options.paddlePadding - this.options.paddleWidth,
            this.aiY,
            this.options.paddleWidth,
            this.options.paddleHeight
        );

        // Draw Ball
        this.ctx.beginPath();
        // Adjust x,y to draw from center for a circle
        this.ctx.arc(
            this.ballX + this.options.ballSize / 2,
            this.ballY + this.options.ballSize / 2,
            this.options.ballSize / 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }
}

gia.register(PongGame);


/*
========================================
EXPECTED HTML
========================================

<section class="pong-section" data-component="PongGame">
    <!-- The canvas sits in the background -->
    <canvas class="pong-canvas" data-ref="PongGame:canvas" aria-hidden="true"></canvas>

    <!-- Content overlay -->
    <div class="pong-content">
        <h2>Interactive Background</h2>
        <p>The canvas runs a Pong simulation you can interact with!</p>

        <div class="pong-scoreboard">
            <div class="score-card">
                <span>Player</span>
                <span class="score" data-ref="PongGame:playerScoreDisplay">0</span>
            </div>
            <div class="score-card">
                <span>AI</span>
                <span class="score" data-ref="PongGame:aiScoreDisplay">0</span>
            </div>
        </div>

        <button type="button" class="pong-pause-btn" data-ref="PongGame:pauseToggle" aria-label="Pause Background Animation">
            <!-- Icon will be injected by component state -->
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
    </div>
</section>

========================================
SUGGESTED SCSS
========================================

.pong-section {
    position: relative;
    width: 100%;
    min-height: 60vh;
    overflow: hidden;
    background-color: #111827; // Fallback
    display: flex;
    align-items: center;
    justify-content: center;

    // Crucial: The container receives pointer events
    touch-action: none; // Prevent scrolling on touch devices when playing
}

.pong-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none; // Let events pass through to section or content
}

.pong-content {
    position: relative;
    z-index: 10; // Keep above canvas
    color: white;
    text-align: center;
    pointer-events: auto; // Content needs to be clickable
    background: rgba(17, 24, 39, 0.7);
    padding: 2rem;
    border-radius: 1rem;
    backdrop-filter: blur(8px);
}

.pong-scoreboard {
    display: flex;
    gap: 2rem;
    justify-content: center;
    margin: 2rem 0;

    .score-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;

        span:first-child {
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #9ca3af;
        }

        .score {
            font-size: 3rem;
            font-weight: bold;
            font-variant-numeric: tabular-nums;
        }
    }
}

.pong-pause-btn {
    appearance: none;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;

    &:hover, &:focus-visible {
        background: rgba(255, 255, 255, 0.2);
        outline: none;
    }

    &:active {
        transform: scale(0.95);
    }
}
*/
