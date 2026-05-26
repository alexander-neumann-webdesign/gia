class VideoHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			playOnHover: false
		};

		this.ref = {
			video: null, // looks for a single element with data-ref="video"
			playPauseButton: null, // looks for a single element with data-ref="playPauseButton"
		};

		this.setState({
			isPlaying: false,
			isManuallyPaused: false,
			isInViewport: false
		});
	}

	mount() {
		if (!this.ref.video) {
			console.warn("VideoHolder: Missing element with data-ref='video'.");
			return;
		}

		// Setup Intersection Observer to play/pause video when entering/leaving viewport
		this.observeIntersection(this.element, this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01 // Start playing as soon as 1% is visible
		});

		if (this.ref.playPauseButton) {
			this.ref.playPauseButton.addEventListener('click', this.togglePlay);
			this.ref.video.addEventListener('play', this.handleNativePlay);
			this.ref.video.addEventListener('pause', this.handleNativePause);

			// Initialize state from DOM
			this.setState({ isPlaying: !this.ref.video.paused });
		}

		if (this.options.playOnHover) {
			this.element.addEventListener('mouseenter', this.handleMouseEnter);
			this.element.addEventListener('mouseleave', this.handleMouseLeave);
		}

		// Swup integration: Stop video playback on page transition
		if (window.swup) {
			this.handleSwupOut = this.handleSwupOut.bind(this);
			window.swup.hooks.on("animation:out:start", this.handleSwupOut);
		}
	}

	unmount() {
		if (window.swup && this.handleSwupOut) {
			window.swup.hooks.off("animation:out:start", this.handleSwupOut);
		}

		if (this.ref.playPauseButton) {
			this.ref.playPauseButton.removeEventListener('click', this.togglePlay);
			this.ref.video.removeEventListener('play', this.handleNativePlay);
			this.ref.video.removeEventListener('pause', this.handleNativePause);
		}

		if (this.options.playOnHover) {
			this.element.removeEventListener('mouseenter', this.handleMouseEnter);
			this.element.removeEventListener('mouseleave', this.handleMouseLeave);
		}
	}

	handleIntersect(entries) {
		entries.forEach((entry) => {
			this.setState({ isInViewport: entry.isIntersecting });
		});
	}

	handleMouseEnter() {
		if (!this.state.isManuallyPaused) {
			this.setState({ isPlaying: true });
		}
	}

	handleMouseLeave() {
		this.setState({ isPlaying: false });
	}

	handleNativePlay() {
		if (!this.state.isPlaying) {
			this.setState({ isPlaying: true });
		}
	}

	handleNativePause() {
		if (this.state.isPlaying) {
			this.setState({ isPlaying: false });
		}
	}

	handleSwupOut() {
		if (this.state.isPlaying) {
			this.setState({ isPlaying: false });
		}
	}

	togglePlay(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.setState({
			isPlaying: !this.state.isPlaying,
			isManuallyPaused: this.state.isPlaying // If it was playing and we toggle, it means manual pause. If it was paused and we toggle, it's manual play (not manually paused).
		});
	}

	stateChange(stateChanges) {
		if ('isInViewport' in stateChanges) {
			if (this.state.isInViewport && !this.state.isManuallyPaused && !this.options.playOnHover) {
				this.setState({ isPlaying: true });
			} else if (!this.state.isInViewport) {
				this.setState({ isPlaying: false });
			}
		}

		if ('isPlaying' in stateChanges) {
			if (this.state.isPlaying) {
				if (this.ref.video.paused) {
					const playPromise = this.ref.video.play();
					if (playPromise !== undefined) {
						playPromise.catch(error => {
							console.warn("Video autoplay blocked or interrupted:", error);
							this.setState({ isPlaying: false });
						});
					}
				}
			} else {
				if (!this.ref.video.paused) {
					this.ref.video.pause();
				}
			}

			if (this.ref.playPauseButton) {
				const isPlaying = this.state.isPlaying;
				const playPauseBtn = this.ref.playPauseButton;

				playPauseBtn.setAttribute('aria-label', isPlaying ? 'Pause video' : 'Play video');

				if (isPlaying) {
					playPauseBtn.classList.remove('is-paused');
					playPauseBtn.classList.add('is-playing');
				} else {
					playPauseBtn.classList.remove('is-playing');
					playPauseBtn.classList.add('is-paused');
				}

				let iconShape = playPauseBtn.querySelector('.icon-shape');
				if (!iconShape) {
					playPauseBtn.replaceChildren();
					playPauseBtn.insertAdjacentHTML('beforeend', '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="none" fill="currentColor"><path class="icon-shape"></path></svg>');
					iconShape = playPauseBtn.querySelector('.icon-shape');
				}

				if (iconShape) {
					if (isPlaying) {
						iconShape.setAttribute('d', 'M 6 4 L 10 4 L 10 20 L 6 20 Z M 14 4 L 18 4 L 18 20 L 14 20 Z');
					} else {
						iconShape.setAttribute('d', 'M 5 3 L 12 7.5 L 12 16.5 L 5 21 Z M 12 7.5 L 19 12 L 19 12 L 12 16.5 Z');
					}
				}
			}
		}
	}
}

gia.register(VideoHolder);

/*
========================================
EXPECTED HTML
========================================

<div data-component="VideoHolder">
  <video data-ref="video" src="video.mp4" loop muted playsinline preload="metadata"></video>
  <button data-ref="playPauseButton" aria-label="Play video" class="is-paused">
    <!-- Icons injected via JS -->
  </button>
</div>

========================================
SUGGESTED SCSS
========================================

div[data-component="VideoHolder"] {
  position: relative;

  video {
    width: 100%;
    height: auto;
    display: block;
  }

  button[data-ref="playPauseButton"] {
    position: absolute;
    bottom: 16px;
    right: 16px;
    background: rgba(0,0,0,0.5);
    color: white;
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease, background-color 0.3s ease;

    svg path.icon-shape {
      transition: d 0.3s ease;
    }

    &:hover {
      background: rgba(0,0,0,0.8);
    }

    &:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  }

  &:hover button[data-ref="playPauseButton"],
  &:focus-within button[data-ref="playPauseButton"] {
    opacity: 1;
    pointer-events: auto;
  }
}
*/
