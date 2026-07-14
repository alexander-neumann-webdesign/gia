class VideoHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			playOnHover: false,
		};

		this.ref = {
			video: null, // looks for a single element with data-ref="video"
			playPauseButton: null, // looks for a single element with data-ref="playPauseButton"
			muteButton: null, // looks for a single element with data-ref="muteButton"
		};

		this.setState({
			isPlaying: false,
			isManuallyPaused: false,
			isInViewport: false,
			isMuted: true,
		});
	}

	mount() {
		if (!this.ref.video) {
			console.warn("VideoHolder: Missing element with data-ref='video'.");
			return;
		}

		// A11y: Ensure component is focusable and has a role
		if (!this.element.hasAttribute("tabindex")) {
			this.element.setAttribute("tabindex", "0");
		}
		if (!this.element.hasAttribute("role")) {
			this.element.setAttribute("role", "region");
			this.element.setAttribute("aria-label", "Video player");
		}

		this.handleKeyDown = this.handleKeyDown.bind(this);
		this.element.addEventListener("keydown", this.handleKeyDown);

		// Setup Intersection Observer to play/pause video when entering/leaving viewport
		this.observeIntersection(this.element, this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01, // Start playing as soon as 1% is visible
		});

		if (this.ref.playPauseButton) {
			this.ref.playPauseButton.addEventListener("click", this.togglePlay);
			this.ref.video.addEventListener("play", this.handleNativePlay);
			this.ref.video.addEventListener("pause", this.handleNativePause);

			// Initialize state from DOM
			this.setState({ isPlaying: !this.ref.video.paused });
		}

		if (this.ref.muteButton) {
			this.toggleMute = this.toggleMute.bind(this);
			this.handleVolumeChange = this.handleVolumeChange.bind(this);

			this.ref.muteButton.addEventListener("click", this.toggleMute);
			this.ref.video.addEventListener("volumechange", this.handleVolumeChange);

			// Initialize state from DOM
			this.setState({ isMuted: this.ref.video.muted });
		}

		if (this.options.playOnHover) {
			this.element.addEventListener("mouseenter", this.handleMouseEnter);
			this.element.addEventListener("mouseleave", this.handleMouseLeave);
		}

		// Swup integration: Stop video playback on page transition
		if (window.swup) {
			this.handleSwupOut = this.handleSwupOut.bind(this);
			window.swup.hooks.on("animation:out:start", this.handleSwupOut);
		}
	}

	unmount() {
		this.element.removeEventListener("keydown", this.handleKeyDown);

		if (window.swup && this.handleSwupOut) {
			window.swup.hooks.off("animation:out:start", this.handleSwupOut);
		}

		if (this.ref.playPauseButton) {
			this.ref.playPauseButton.removeEventListener("click", this.togglePlay);
			this.ref.video.removeEventListener("play", this.handleNativePlay);
			this.ref.video.removeEventListener("pause", this.handleNativePause);
		}

		if (this.ref.muteButton) {
			this.ref.muteButton.removeEventListener("click", this.toggleMute);
			this.ref.video.removeEventListener("volumechange", this.handleVolumeChange);
		}

		if (this.options.playOnHover) {
			this.element.removeEventListener("mouseenter", this.handleMouseEnter);
			this.element.removeEventListener("mouseleave", this.handleMouseLeave);
		}
	}

	handleIntersect(entries) {
		for (let i = 0; i < entries.length; i++) {
			this.setState({ isInViewport: entries[i].isIntersecting });
		}
	}

	handleKeyDown(event) {
		// Spacebar for play/pause
		if (event.key === " " || event.code === "Space") {
			// Prevent default page scroll on spacebar
			event.preventDefault();
			this.togglePlay();
		}
		// 'm' or 'M' for mute/unmute
		if (event.key === "m" || event.key === "M") {
			this.toggleMute();
		}
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

	handleVolumeChange() {
		if (this.state.isMuted !== this.ref.video.muted) {
			this.setState({ isMuted: this.ref.video.muted });
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
			isManuallyPaused: this.state.isPlaying, // If it was playing and we toggle, it means manual pause. If it was paused and we toggle, it's manual play (not manually paused).
		});
	}

	toggleMute(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.setState({
			isMuted: !this.state.isMuted,
		});
	}

	stateChange(stateChanges) {
		if ("isInViewport" in stateChanges) {
			if (this.state.isInViewport && !this.state.isManuallyPaused && !this.options.playOnHover) {
				this.setState({ isPlaying: true });
			} else if (!this.state.isInViewport) {
				this.setState({ isPlaying: false });
			}
		}

		if ("isPlaying" in stateChanges) {
			this._updateVideoState();
			this._updatePlayPauseButton();
		}

		if ("isMuted" in stateChanges) {
			this._updateMuteState();
			this._updateMuteButton();
		}
	}

	_updateVideoState() {
		if (this.state.isPlaying) {
			if (this.ref.video.paused) {
				const playPromise = this.ref.video.play();
				if (playPromise !== undefined) {
					playPromise.catch((error) => {
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
	}

	_updatePlayPauseButton() {
		if (!this.ref.playPauseButton) return;

		const isPlaying = this.state.isPlaying;
		const playPauseBtn = this.ref.playPauseButton;
		let iconShape = playPauseBtn.querySelector(".icon-shape");

		gia.mutate(() => {
			playPauseBtn.setAttribute("aria-label", isPlaying ? "Pause video" : "Play video");

			if (isPlaying) {
				playPauseBtn.classList.remove("is-paused");
				playPauseBtn.classList.add("is-playing");
			} else {
				playPauseBtn.classList.remove("is-playing");
				playPauseBtn.classList.add("is-paused");
			}

			if (!iconShape) {
				playPauseBtn.replaceChildren();
				playPauseBtn.insertAdjacentHTML(
					"beforeend",
					'<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="none" fill="currentColor"><path class="icon-shape"></path></svg>',
				);
				iconShape = playPauseBtn.querySelector(".icon-shape");
			}

			if (iconShape) {
				if (isPlaying) {
					iconShape.setAttribute("d", "M 6 4 L 10 4 L 10 20 L 6 20 Z M 14 4 L 18 4 L 18 20 L 14 20 Z");
				} else {
					iconShape.setAttribute("d", "M 5 3 L 12 7.5 L 12 16.5 L 5 21 Z M 12 7.5 L 19 12 L 19 12 L 12 16.5 Z");
				}
			}
		});
	}

	_updateMuteState() {
		if (this.ref.video.muted !== this.state.isMuted) {
			this.ref.video.muted = this.state.isMuted;
		}
	}

	_updateMuteButton() {
		if (!this.ref.muteButton) return;

		const isMuted = this.state.isMuted;
		const muteBtn = this.ref.muteButton;
		let iconShape = muteBtn.querySelector(".icon-shape");

		gia.mutate(() => {
			muteBtn.setAttribute("aria-label", isMuted ? "Unmute video" : "Mute video");

			if (isMuted) {
				muteBtn.classList.remove("is-unmuted");
				muteBtn.classList.add("is-muted");
			} else {
				muteBtn.classList.remove("is-muted");
				muteBtn.classList.add("is-unmuted");
			}

			if (!iconShape) {
				muteBtn.replaceChildren();
				muteBtn.insertAdjacentHTML(
					"beforeend",
					'<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="icon-shape"></path></svg>',
				);
				iconShape = muteBtn.querySelector(".icon-shape");
			}

			if (iconShape) {
				if (isMuted) {
					iconShape.setAttribute("d", "M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6");
				} else {
					iconShape.setAttribute("d", "M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07");
				}
			}
		});
	}
}

gia.register(VideoHolder);

/*
========================================
EXPECTED HTML
========================================

<div data-component="VideoHolder" tabindex="0" role="region" aria-label="Video player">
  <video data-ref="video" src="video.mp4" loop muted playsinline preload="metadata"></video>
  <div class="video-controls">
    <button data-ref="playPauseButton" aria-label="Play video" class="is-paused">
      <!-- Icons injected via JS -->
    </button>
    <button data-ref="muteButton" aria-label="Unmute video" class="is-muted">
      <!-- Icons injected via JS -->
    </button>
  </div>
</div>

========================================
SUGGESTED SCSS
========================================

div[data-component="VideoHolder"] {
  position: relative;
  overflow: hidden;

  &:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 4px;
  }

  video {
    width: 100%;
    height: auto;
    display: block;
  }

  .video-controls {
    position: absolute;
    bottom: 16px;
    right: 16px;
    display: flex;
    gap: 8px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  button[data-ref="playPauseButton"],
  button[data-ref="muteButton"] {
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    transform: scale(1);

    svg path.icon-shape {
      transition: d 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    }

    &:hover {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.4);
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    &:active {
      transform: scale(0.95);
      background: rgba(255, 255, 255, 0.3);
    }

    &:focus-visible {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  }

  &:hover .video-controls,
  &:focus-within .video-controls {
    opacity: 1;
    pointer-events: auto;
  }
}
*/
