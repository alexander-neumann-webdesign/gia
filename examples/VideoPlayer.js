class VideoPlayer extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			playOnHover: false,
			playOnClick: false,
			autoplay: true,
		};

		this.ref = {
			video: null, // looks for a single element with data-ref="video"
			playPauseButton: null, // looks for a single element with data-ref="playPauseButton"
			subtitleButton: null, // looks for a single element with data-ref="subtitleButton"
			muteButton: null, // looks for a single element with data-ref="muteButton"
			volumeSlider: null, // looks for a single element with data-ref="volumeSlider"
			timelineSlider: null, // looks for a single element with data-ref="timelineSlider"
			bigPlayButton: null, // looks for a single element with data-ref="bigPlayButton"
		};

		this.setState({
			isPlaying: false,
			isManuallyPaused: false,
			isInViewport: false,
			isMuted: true,
			volume: 1,
			subtitlesEnabled: false,
			duration: 0,
			isHovered: false,
			isFocused: false,
			hasStarted: !this.options.playOnClick,
			hasInteracted: false,
		});

		this._previousVolume = 1;
		this._renderLoopTick = this._renderLoopTick.bind(this);
	}

	mount() {
		if (!this.ref.video) {
			console.warn("VideoPlayer: Missing element with data-ref='video'.");
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

		if (this.ref.bigPlayButton) {
			this.ref.bigPlayButton.addEventListener("click", this.handleBigPlayClick);
		}

		if (this.ref.subtitleButton) {
			this.ref.subtitleButton.addEventListener("click", this.toggleSubtitles);

			// Initialize state from DOM (check if any track is showing)
			let hasSubtitlesShowing = false;
			const tracks = this.ref.video.textTracks;
			for (let i = 0; i < tracks.length; i++) {
				if (tracks[i].mode === "showing") {
					hasSubtitlesShowing = true;
					break;
				}
			}
			this.setState({ subtitlesEnabled: hasSubtitlesShowing });
		}

		if (this.ref.muteButton) {
			this.ref.muteButton.addEventListener("click", this.toggleMute);
			this.ref.video.addEventListener("volumechange", this.handleVolumeChange);

			// Initialize state from DOM
			this.setState({
				isMuted: this.ref.video.muted,
				volume: this.ref.video.muted ? 0 : this.ref.video.volume,
			});
		}

		if (this.ref.volumeSlider) {
			this.ref.volumeSlider.addEventListener("input", this.handleVolumeInput);
			const initialVolume = this.ref.video.muted ? 0 : this.ref.video.volume;
			this.ref.volumeSlider.value = initialVolume;
			this.ref.volumeSlider.style.setProperty("--volume-progress", initialVolume);
		}

		if (this.ref.timelineSlider) {
			this.ref.timelineSlider.addEventListener("input", this.handleTimelineInput);
			this.ref.timelineSlider.addEventListener("mousedown", this.handleTimelineDragStart);
			this.ref.timelineSlider.addEventListener("touchstart", this.handleTimelineDragStart, { passive: true });
			this.ref.timelineSlider.addEventListener("change", this.handleTimelineChange);
			this.ref.video.addEventListener("timeupdate", this.handleTimeUpdate);
			this.ref.video.addEventListener("loadedmetadata", this.handleLoadedMetadata);

			if (this.ref.video.readyState >= 1) {
				this.setState({ duration: this.ref.video.duration });
			}
		}

		this.element.addEventListener("mouseenter", this.handleMouseEnter);
		this.element.addEventListener("mouseleave", this.handleMouseLeave);
		this.element.addEventListener("focusin", this.handleFocusIn);
		this.element.addEventListener("focusout", this.handleFocusOut);

		// Swup integration: Stop video playback on page transition
		if (window.swup) {
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

		if (this.ref.bigPlayButton) {
			this.ref.bigPlayButton.removeEventListener("click", this.handleBigPlayClick);
		}

		if (this.ref.subtitleButton) {
			this.ref.subtitleButton.removeEventListener("click", this.toggleSubtitles);
		}

		if (this.ref.muteButton) {
			this.ref.muteButton.removeEventListener("click", this.toggleMute);
			this.ref.video.removeEventListener("volumechange", this.handleVolumeChange);
		}

		if (this.ref.volumeSlider) {
			this.ref.volumeSlider.removeEventListener("input", this.handleVolumeInput);
		}

		if (this.ref.timelineSlider) {
			this.ref.timelineSlider.removeEventListener("input", this.handleTimelineInput);
			this.ref.timelineSlider.removeEventListener("mousedown", this.handleTimelineDragStart);
			this.ref.timelineSlider.removeEventListener("touchstart", this.handleTimelineDragStart);
			this.ref.timelineSlider.removeEventListener("change", this.handleTimelineChange);
			this.ref.video.removeEventListener("timeupdate", this.handleTimeUpdate);
			this.ref.video.removeEventListener("loadedmetadata", this.handleLoadedMetadata);
		}

		this.element.removeEventListener("mouseenter", this.handleMouseEnter);
		this.element.removeEventListener("mouseleave", this.handleMouseLeave);
		this.element.removeEventListener("focusin", this.handleFocusIn);
		this.element.removeEventListener("focusout", this.handleFocusOut);

		this._stopRenderLoop();
	}

	handleIntersect([entry]) {
		this.setState({ isInViewport: entry.isIntersecting });
	}

	handleKeyDown(event) {
		// Spacebar for play/pause
		if (event.key === " " || event.code === "Space") {
			// Prevent default page scroll on spacebar
			event.preventDefault();
			if (!this.state.hasStarted) {
				this.handleBigPlayClick();
			} else {
				this.togglePlay();
			}
		}
		// 'm' or 'M' for mute/unmute
		if (event.key === "m" || event.key === "M") {
			if (this.state.hasStarted) this.toggleMute();
		}
		// 'c' or 'C' for captions/subtitles
		if (event.key === "c" || event.key === "C") {
			if (this.state.hasStarted) this.toggleSubtitles();
		}
	}

	handleMouseEnter() {
		this.setState({ isHovered: true });
		if (this.options.playOnHover && !this.state.isManuallyPaused && (this.options.autoplay || this.state.hasInteracted)) {
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
		// Only set to false if focus completely left the element
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

	handleVolumeChange() {
		if (this.state.isMuted !== this.ref.video.muted) {
			this.setState({ isMuted: this.ref.video.muted });
		}
		if (this.state.volume !== this.ref.video.volume) {
			this.setState({ volume: this.ref.video.volume });
		}
	}

	handleVolumeInput(event) {
		const newVolume = event.target.valueAsNumber;
		if (newVolume > 0) {
			this._previousVolume = newVolume;
		}
		this.setState({
			volume: newVolume,
			isMuted: newVolume === 0,
		});
	}

	handleTimelineInput(event) {
		const newTime = event.target.valueAsNumber;
		this.ref.video.currentTime = newTime;
		this._syncTimelineDOM(newTime);
	}

	handleTimelineDragStart() {
		this._isScrubbing = true;
	}

	handleTimelineChange() {
		this._isScrubbing = false;
	}

	handleTimeUpdate() {
		// Conserve CPU by halting timeline updates when invisible
		const isVisible = this.state.isHovered || this.state.isFocused;
		if (isVisible || this._isScrubbing) {
			this._syncTimelineDOM(this.ref.video.currentTime);
		}
	}

	_renderLoopTick() {
		const isVisible = this.state.isHovered || this.state.isFocused;
		if (!this.state.isPlaying || !isVisible) {
			this._rAF = null;
			return; // Organically halt loop if state changed
		}

		if (!this._isScrubbing) {
			this._syncTimelineDOM(this.ref.video.currentTime);
		}

		this._rAF = requestAnimationFrame(this._renderLoopTick);
	}

	_startRenderLoop() {
		if (this._rAF || !this.ref.timelineSlider) return;
		this._rAF = requestAnimationFrame(this._renderLoopTick);
	}

	_stopRenderLoop() {
		if (this._rAF) {
			cancelAnimationFrame(this._rAF);
			this._rAF = null;
		}
	}

	handleLoadedMetadata() {
		this.setState({ duration: this.ref.video.duration });
	}

	handleSwupOut() {
		if (this.state.isPlaying) {
			this.setState({ isPlaying: false });
		}
	}

	handleBigPlayClick(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}
		
		if (this.ref.video) {
			this.ref.video.currentTime = 0;
		}

		this.setState({
			hasStarted: true,
			hasInteracted: true,
			isPlaying: true,
			isManuallyPaused: false,
			isMuted: false,
			volume: this._previousVolume > 0 ? this._previousVolume : 1
		});
	}

	togglePlay(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.setState({
			hasInteracted: true,
			isPlaying: !this.state.isPlaying,
			isManuallyPaused: this.state.isPlaying, // If it was playing and we toggle, it means manual pause. If it was paused and we toggle, it's manual play (not manually paused).
		});
	}

	toggleMute(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		const willBeMuted = !this.state.isMuted;

		if (willBeMuted && this.state.volume > 0) {
			this._previousVolume = this.state.volume;
		}

		this.setState({
			isMuted: willBeMuted,
			volume: willBeMuted ? 0 : this._previousVolume > 0 ? this._previousVolume : 1,
		});
	}

	toggleSubtitles(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		this.setState({
			subtitlesEnabled: !this.state.subtitlesEnabled,
		});
	}

	stateChange(stateChanges) {
		if ("isInViewport" in stateChanges) {
			const canAutoplay = this.options.autoplay || this.state.hasInteracted;
			if (this.state.isInViewport && !this.state.isManuallyPaused && !this.options.playOnHover && canAutoplay) {
				this.setState({ isPlaying: true });
			} else if (!this.state.isInViewport) {
				this.setState({ isPlaying: false });
			}
		}

		if ("isPlaying" in stateChanges || "isHovered" in stateChanges || "isFocused" in stateChanges) {
			if ("isPlaying" in stateChanges) {
				this._updateVideoState();
				this._updatePlayPauseButton();
			}

			const isVisible = this.state.isHovered || this.state.isFocused;
			if (this.state.isPlaying && isVisible) {
				this._startRenderLoop();
			} else {
				this._stopRenderLoop();
			}
		}

		if ("isMuted" in stateChanges || "volume" in stateChanges) {
			this._updateMuteState();
			this._updateMuteButton();
		}

		if ("subtitlesEnabled" in stateChanges) {
			this._updateSubtitlesState();
			this._updateSubtitleButton();
		}

		if ("duration" in stateChanges) {
			this._syncTimelineDOM(this.ref.video.currentTime);
		}

		if ("hasStarted" in stateChanges) {
			if (this.ref.bigPlayButton) {
				this.ref.bigPlayButton.setAttribute("aria-hidden", this.state.hasStarted.toString());
			}
		}

		if (("isHovered" in stateChanges || "isFocused" in stateChanges) && (this.state.isHovered || this.state.isFocused)) {
			this.handleTimeUpdate();
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

	_syncTimelineDOM(currentTime) {
		if (!this.ref.timelineSlider) return;

		const duration = this.state.duration;

		if (this._lastDuration !== duration) {
			this.ref.timelineSlider.max = duration;
			this._lastDuration = duration;
		}

		// Only update native value if the user isn't currently dragging it
		// The _isScrubbing flag prevents the slider jumping while dragging
		if (!this._isScrubbing && this._lastTimelineValue !== currentTime) {
			this.ref.timelineSlider.value = currentTime;
			this._lastTimelineValue = currentTime;
		}

		const progress = duration > 0 ? currentTime / duration : 0;
		if (this._lastTimelineProgress !== progress) {
			this.ref.timelineSlider.style.setProperty("--timeline-progress", progress);
			this._lastTimelineProgress = progress;
		}
	}

	_updateMuteState() {
		if (this.ref.video.muted !== this.state.isMuted) {
			this.ref.video.muted = this.state.isMuted;
		}
		if (this.ref.video.volume !== this.state.volume) {
			this.ref.video.volume = this.state.volume;
		}
	}

	_updateSubtitlesState() {
		const tracks = this.ref.video.textTracks;
		if (!tracks) return;

		for (let i = 0; i < tracks.length; i++) {
			tracks[i].mode = this.state.subtitlesEnabled ? "showing" : "hidden";
		}
	}

	_updateSubtitleButton() {
		if (!this.ref.subtitleButton) return;

		const isEnabled = this.state.subtitlesEnabled;
		const subtitleBtn = this.ref.subtitleButton;

		subtitleBtn.setAttribute("aria-pressed", isEnabled.toString());

		if (isEnabled) {
			subtitleBtn.classList.remove("is-disabled");
			subtitleBtn.classList.add("is-enabled");
		} else {
			subtitleBtn.classList.remove("is-enabled");
			subtitleBtn.classList.add("is-disabled");
		}

		if (!this.ref.subtitleIconShape) {
			subtitleBtn.replaceChildren();
			subtitleBtn.insertAdjacentHTML(
				"beforeend",
				'<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="icon-shape"></path></svg>',
			);
			this.ref.subtitleIconShape = subtitleBtn.querySelector(".icon-shape");
		}

		if (this.ref.subtitleIconShape) {
			if (isEnabled) {
				this.ref.subtitleIconShape.setAttribute(
					"d",
					"M 3 6 L 21 6 L 21 18 L 3 18 Z M 15 14 L 17 14 M 7 14 L 12 14 M 13 10 L 17 10 M 7 10 L 10 10 M 7 14 L 12 14",
				);
			} else {
				this.ref.subtitleIconShape.setAttribute(
					"d",
					"M 3 6 L 21 6 L 21 18 L 3 18 Z M 12 12 L 15 15 M 9 15 L 12 12 M 15 9 L 12 12 M 9 9 L 12 12 M 9 15 L 12 12",
				);
			}
		}
	}

	_updateMuteButton() {
		if (!this.ref.muteButton) return;

		const isMuted = this.state.isMuted;
		const muteBtn = this.ref.muteButton;

		muteBtn.setAttribute("aria-pressed", isMuted.toString());

		if (isMuted) {
			muteBtn.classList.remove("is-unmuted");
			muteBtn.classList.add("is-muted");
		} else {
			muteBtn.classList.remove("is-muted");
			muteBtn.classList.add("is-unmuted");
		}

		if (!this.ref.muteIconShape) {
			muteBtn.replaceChildren();
			muteBtn.insertAdjacentHTML(
				"beforeend",
				'<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path class="icon-shape"></path></svg>',
			);
			this.ref.muteIconShape = muteBtn.querySelector(".icon-shape");
		}

		if (this.ref.muteIconShape) {
			if (isMuted || this.state.volume === 0) {
				this.ref.muteIconShape.setAttribute(
					"d",
					"M 11 5 L 6 9 L 2 9 L 2 15 L 6 15 L 11 19 L 11 5 Z M 15 9 C 17 11, 19 13, 21 15 M 21 9 C 19 11, 17 13, 15 15",
				);
			} else if (this.state.volume < 0.5) {
				this.ref.muteIconShape.setAttribute(
					"d",
					"M 11 5 L 6 9 L 2 9 L 2 15 L 6 15 L 11 19 L 11 5 Z M 15 9 C 17 11, 17 13, 15 15 M 15 12 C 15 12, 15 12, 15 12",
				);
			} else {
				this.ref.muteIconShape.setAttribute(
					"d",
					"M 11 5 L 6 9 L 2 9 L 2 15 L 6 15 L 11 19 L 11 5 Z M 15 9 C 17 11, 17 13, 15 15 M 18 6 C 22 10, 22 14, 18 18",
				);
			}
		}

		if (this.ref.volumeSlider) {
			if (this._lastVolume !== this.state.volume) {
				this.ref.volumeSlider.value = this.state.volume;
				this.ref.volumeSlider.style.setProperty("--volume-progress", this.state.volume);
				this._lastVolume = this.state.volume;
			}
		}
	}
}

gia.register(VideoPlayer);

/*
========================================
EXPECTED HTML
========================================

<div data-component="VideoPlayer" tabindex="0" role="region" aria-label="Video player">
  <video data-ref="video" src="video.mp4" loop muted playsinline preload="metadata">
    <track kind="subtitles" srclang="en" label="English" src="subtitles.vtt">
  </video>
  <button type="button" data-ref="bigPlayButton" aria-label="Start video" class="big-play-button">
    <svg aria-hidden="true" viewBox="0 0 24 24" width="48" height="48" stroke="none" fill="currentColor">
      <path d="M 6 4 L 20 12 L 6 20 Z"></path>
    </svg>
  </button>
  <div class="video-controls">
    <button type="button" data-ref="playPauseButton" aria-label="Play or pause video" aria-pressed="false" class="is-paused">
      <!-- Icons injected via JS -->
    </button>
    <button type="button" data-ref="subtitleButton" aria-label="Toggle subtitles" aria-pressed="false" class="is-disabled">
      <!-- Icons injected via JS -->
    </button>
    <div class="mute-container">
      <div class="volume-slider-wrapper">
        <input type="range" data-ref="volumeSlider" class="volume-slider" min="0" max="1" step="0.01" aria-label="Volume">
      </div>
      <button type="button" data-ref="muteButton" aria-label="Mute or unmute video" aria-pressed="true" class="is-muted">
        <!-- Icons injected via JS -->
      </button>
    </div>
  </div>
  <div class="timeline-container">
    <input type="range" data-ref="timelineSlider" class="timeline-slider" min="0" max="0" step="0.01" value="0" aria-label="Video timeline">
  </div>
</div>

========================================
SUGGESTED SCSS
========================================

div[data-component="VideoPlayer"] {
  position: relative;
  overflow: hidden;

  &:focus-visible {
    outline: 3px solid #005fcc;
    outline-offset: 4px;
  }

  &[data-has-started="false"] {
    .big-play-button {
      opacity: 1;
      pointer-events: auto;
    }
    .video-controls, .timeline-container {
      opacity: 0 !important;
      pointer-events: none !important;
    }
  }

  .big-play-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s ease;
    opacity: 0;
    pointer-events: none;
    
    &:hover {
      background: rgba(0, 0, 0, 0.7);
      transform: translate(-50%, -50%) scale(1.1);
    }
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
  }

  .mute-container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .volume-slider-wrapper {
    position: absolute;
    bottom: 100%;
    margin-bottom: 8px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    width: 48px;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: all 0.3s ease;
  }

  .mute-container:hover .volume-slider-wrapper,
  .mute-container:focus-within .volume-slider-wrapper {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .volume-slider {
    transform: rotate(-90deg);
    width: 100px;
    padding: 16px 0;
    margin: 0;
    cursor: pointer;
    -webkit-appearance: none;
    background: transparent;

    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: linear-gradient(to right, #ffffff calc(6px + var(--volume-progress, 1) * (100% - 12px)), rgba(255, 255, 255, 0.3) 0);
      border-radius: 2px;
    }

    &::-moz-range-track {
      width: 100%;
      height: 4px;
      background: linear-gradient(to right, #ffffff calc(6px + var(--volume-progress, 1) * (100% - 12px)), rgba(255, 255, 255, 0.3) 0);
      border-radius: 2px;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 12px;
      width: 12px;
      border-radius: 50%;
      background-color: #ffffff;
      margin-top: -4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s;
    }

    &::-moz-range-thumb {
      height: 12px;
      width: 12px;
      border: none;
      border-radius: 50%;
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s;
    }

    &:active::-webkit-slider-thumb,
    &:focus-visible::-webkit-slider-thumb,
    &:active::-moz-range-thumb,
    &:focus-visible::-moz-range-thumb {
      transform: scale(1.3);
    }
  }

  button[data-ref="playPauseButton"],
  button[data-ref="subtitleButton"],
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
    opacity: 0;
    pointer-events: none;
    transform: scale(0.8) translateZ(0);
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    will-change: transform, opacity, backdrop-filter;

    svg path.icon-shape {
      transition: d 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    }
  }

  &:hover,
  &:focus-within {
    button[data-ref="playPauseButton"],
    button[data-ref="subtitleButton"],
    button[data-ref="muteButton"] {
      opacity: 1;
      pointer-events: auto;
      transform: scale(1) translateZ(0);
    }
    
    .timeline-container {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) translateZ(0);
    }
  }

  button[data-ref="playPauseButton"]:hover,
  button[data-ref="subtitleButton"]:hover,
  button[data-ref="muteButton"]:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
    transform: scale(1.1) translateZ(0);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  button[data-ref="playPauseButton"]:active,
  button[data-ref="subtitleButton"]:active,
  button[data-ref="muteButton"]:active {
    transform: scale(0.95) translateZ(0);
    background: rgba(255, 255, 255, 0.3);
  }

  button[data-ref="playPauseButton"]:focus-visible,
  button[data-ref="subtitleButton"]:focus-visible,
  button[data-ref="muteButton"]:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }

  .timeline-container {
    position: absolute;
    bottom: 16px;
    left: 16px;
    right: 184px;
    height: 48px;
    padding: 0 20px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px) translateZ(0);
    transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 24px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    will-change: transform, opacity;
  }

  .timeline-container:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .timeline-slider {
    width: 100%;
    margin: 0;
    padding: 16px 0;
    cursor: pointer;
    -webkit-appearance: none;
    background: transparent;

    &::-webkit-slider-runnable-track {
      width: 100%;
      height: 4px;
      background: linear-gradient(to right, #ffffff calc(6px + var(--timeline-progress, 0) * (100% - 12px)), rgba(255, 255, 255, 0.3) 0);
      border-radius: 2px;
    }

    &::-moz-range-track {
      width: 100%;
      height: 4px;
      background: linear-gradient(to right, #ffffff calc(6px + var(--timeline-progress, 0) * (100% - 12px)), rgba(255, 255, 255, 0.3) 0);
      border-radius: 2px;
    }

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      height: 12px;
      width: 12px;
      border-radius: 50%;
      background-color: #ffffff;
      margin-top: -4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s;
    }

    &::-moz-range-thumb {
      height: 12px;
      width: 12px;
      border: none;
      border-radius: 50%;
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: transform 0.1s;
    }
    
    &:active::-webkit-slider-thumb,
    &:focus-visible::-webkit-slider-thumb,
    &:active::-moz-range-thumb,
    &:focus-visible::-moz-range-thumb {
      transform: scale(1.3);
    }
  }
}
*/
