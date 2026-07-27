class VideoHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			playOnHover: false,
		};

		this.ref = {
			video: null, // looks for a single element with data-ref="video"
			playPauseButton: null, // optional play/pause button
		};

		this.setState({
			isPlaying: false,
			isManuallyPaused: false,
			isInViewport: false,
			isHovered: false,
			isFocused: false,
		});
	}

	mount() {
		if (!this.ref.video) {
			console.warn("VideoHolder: Missing element with data-ref='video'.");
			return;
		}

		if (!this.element.hasAttribute("tabindex") && this.ref.playPauseButton) {
			this.element.setAttribute("tabindex", "0");
		}

		if (this.ref.playPauseButton) {
			this.element.addEventListener("keydown", this.handleKeyDown);
			this.ref.playPauseButton.addEventListener("click", this.togglePlay);
		}

		this.observeIntersection(this.element, this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01,
		});

		this.ref.video.addEventListener("play", this.handleNativePlay);
		this.ref.video.addEventListener("pause", this.handleNativePause);
		this.setState({ isPlaying: !this.ref.video.paused });

		if (this.options.playOnHover) {
			this.element.addEventListener("mouseenter", this.handleMouseEnter);
			this.element.addEventListener("mouseleave", this.handleMouseLeave);
			this.element.addEventListener("focusin", this.handleFocusIn);
			this.element.addEventListener("focusout", this.handleFocusOut);
		}

		if (window.swup) {
			window.swup.hooks.on("animation:out:start", this.handleSwupOut);
		}
	}

	unmount() {
		if (this.ref.playPauseButton) {
			this.element.removeEventListener("keydown", this.handleKeyDown);
			this.ref.playPauseButton.removeEventListener("click", this.togglePlay);
		}

		this.ref.video.removeEventListener("play", this.handleNativePlay);
		this.ref.video.removeEventListener("pause", this.handleNativePause);

		if (this.options.playOnHover) {
			this.element.removeEventListener("mouseenter", this.handleMouseEnter);
			this.element.removeEventListener("mouseleave", this.handleMouseLeave);
			this.element.removeEventListener("focusin", this.handleFocusIn);
			this.element.removeEventListener("focusout", this.handleFocusOut);
		}

		if (window.swup && this.handleSwupOut) {
			window.swup.hooks.off("animation:out:start", this.handleSwupOut);
		}
	}

	handleIntersect([entry]) {
		this.setState({ isInViewport: entry.isIntersecting });
	}

	handleKeyDown(event) {
		if (event.key === " " || event.code === "Space") {
			event.preventDefault();
			this.togglePlay();
		}
	}

	handleMouseEnter() {
		this.setState({ isHovered: true });
		if (this.options.playOnHover && !this.state.isManuallyPaused) {
			this.setState({ isPlaying: true });
		}
	}

	handleMouseLeave() {
		this.setState({ isHovered: false });
		if (this.options.playOnHover) {
			this.setState({ isPlaying: false });
		}
	}

	handleFocusIn() {
		this.setState({ isFocused: true });
	}

	handleFocusOut(event) {
		if (!this.element.contains(event.relatedTarget)) {
			this.setState({ isFocused: false });
		}
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
			isManuallyPaused: this.state.isPlaying,
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
	}

	_updateVideoState() {
		if (this.state.isPlaying) {
			if (this.ref.video.paused) {
				const playPromise = this.ref.video.play();
				if (playPromise !== undefined) {
					playPromise.catch((error) => {
						console.warn("VideoHolder autoplay blocked:", error);
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

		playPauseBtn.setAttribute("aria-pressed", isPlaying.toString());

		if (isPlaying) {
			playPauseBtn.classList.remove("is-paused");
			playPauseBtn.classList.add("is-playing");
		} else {
			playPauseBtn.classList.remove("is-playing");
			playPauseBtn.classList.add("is-paused");
		}

		if (!this.ref.playIconShape) {
			playPauseBtn.replaceChildren();
			playPauseBtn.insertAdjacentHTML(
				"beforeend",
				'<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="none" fill="currentColor"><path class="icon-shape"></path></svg>',
			);
			this.ref.playIconShape = playPauseBtn.querySelector(".icon-shape");
		}

		if (this.ref.playIconShape) {
			if (isPlaying) {
				this.ref.playIconShape.setAttribute("d", "M 6 4 L 10 4 L 10 20 L 6 20 Z M 14 4 L 18 4 L 18 20 L 14 20 Z");
			} else {
				this.ref.playIconShape.setAttribute("d", "M 5 3 L 12 7.5 L 12 16.5 L 5 21 Z M 12 7.5 L 19 12 L 19 12 L 12 16.5 Z");
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
  <button type="button" data-ref="playPauseButton" aria-label="Play or pause video" aria-pressed="false" class="play-pause-btn is-paused">
    <!-- Icons injected via JS -->
  </button>
</div>

========================================
SUGGESTED SCSS
========================================

div[data-component="VideoHolder"] {
  position: relative;
  overflow: hidden;

  video {
    width: 100%;
    height: auto;
    display: block;
  }

  button[data-ref="playPauseButton"] {
    position: absolute;
    bottom: 16px;
    right: 16px;
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
    opacity: 0;
    pointer-events: none;
    transform: scale(0.8) translateZ(0);
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    will-change: transform, opacity, backdrop-filter;

    svg path.icon-shape {
      transition: d 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    }
  }

  &:hover button[data-ref="playPauseButton"],
  &:focus-within button[data-ref="playPauseButton"] {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1) translateZ(0);
  }

  button[data-ref="playPauseButton"]:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.1) translateZ(0);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  button[data-ref="playPauseButton"]:active {
    transform: scale(0.95) translateZ(0);
    background: rgba(255, 255, 255, 0.3);
  }
}
*/
