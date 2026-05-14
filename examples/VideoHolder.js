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
			isInViewport: false,
			isHovered: false
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

			// set initial hover state styles
			this.ref.playPauseButton.style.opacity = '0';
			this.ref.playPauseButton.style.pointerEvents = 'none';
			this.ref.playPauseButton.style.transition = 'opacity 0.2s ease-in-out';

			// Initialize state from DOM
			this.setState({ isPlaying: !this.ref.video.paused });
		}

		if (this.options.playOnHover || this.ref.playPauseButton) {
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

		if (this.options.playOnHover || this.ref.playPauseButton) {
			this.element.removeEventListener('mouseenter', this.handleMouseEnter);
			this.element.removeEventListener('mouseleave', this.handleMouseLeave);
		}
	}

	handleIntersect(entries) {
		const entry = entries[entries.length - 1];
		this.setState({ isInViewport: entry.isIntersecting });
	}

	handleMouseEnter() {
		const stateUpdates = { isHovered: true };
		if (this.options.playOnHover && !this.state.isManuallyPaused) {
			stateUpdates.isPlaying = true;
		}
		this.setState(stateUpdates);
	}

	handleMouseLeave() {
		const stateUpdates = { isHovered: false };
		if (this.options.playOnHover) {
			stateUpdates.isPlaying = false;
		}
		this.setState(stateUpdates);
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

		if ('isHovered' in stateChanges) {
			if (this.ref.playPauseButton) {
				if (this.state.isHovered) {
					this.ref.playPauseButton.style.opacity = '1';
					this.ref.playPauseButton.style.pointerEvents = 'auto';
				} else {
					this.ref.playPauseButton.style.opacity = '0';
					this.ref.playPauseButton.style.pointerEvents = 'none';
				}
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
				if (this.state.isPlaying) {
					this.ref.playPauseButton.setAttribute('aria-label', 'Pause video');
					this.ref.playPauseButton.classList.remove('is-paused');
					this.ref.playPauseButton.classList.add('is-playing');
					this.ref.playPauseButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
				} else {
					this.ref.playPauseButton.setAttribute('aria-label', 'Play video');
					this.ref.playPauseButton.classList.remove('is-playing');
					this.ref.playPauseButton.classList.add('is-paused');
					this.ref.playPauseButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
				}
			}
		}
	}
}

gia.register(VideoHolder);

/**
 * Expected HTML Structure:
 *
 * <div data-component="VideoHolder">
 *   <video data-ref="video" src="video.mp4" loop muted playsinline preload="metadata"></video>
 *   <button data-ref="playPauseButton" aria-label="Play video" class="is-paused">
 *     <!-- Icons injected via JS -->
 *   </button>
 * </div>
 *
 * Suggested SCSS:
 *
 * div[data-component="VideoHolder"] {
 *   position: relative;
 *
 *   video {
 *     width: 100%;
 *     height: auto;
 *     display: block;
 *   }
 *
 *   button[data-ref="playPauseButton"] {
 *     position: absolute;
 *     bottom: 16px;
 *     right: 16px;
 *     background: rgba(0,0,0,0.5);
 *     color: white;
 *     border: none;
 *     border-radius: 50%;
 *     width: 48px;
 *     height: 48px;
 *     cursor: pointer;
 *     display: flex;
 *     align-items: center;
 *     justify-content: center;
 *     transition: background-color 0.3s ease;
 *
 *     &:hover {
 *       background: rgba(0,0,0,0.8);
 *     }
 *   }
 * }
 */
