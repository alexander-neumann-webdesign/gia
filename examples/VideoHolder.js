class VideoHolder extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			playOnHover: false
		};

		this.video = this.element.querySelector('video');
		this.playPauseButton = this.element.querySelector('[data-ref="playPauseButton"]');

		this.isManuallyPaused = false;
	}

	mount() {
		if (!this.video) return;

		// Setup Intersection Observer to play/pause video when entering/leaving viewport
		this.intersectionObserver = new IntersectionObserver(this.handleIntersect, {
			rootMargin: "0px",
			threshold: 0.01 // Start playing as soon as 1% is visible
		});
		this.intersectionObserver.observe(this.element);

		if (this.playPauseButton) {
			this.playPauseButton.addEventListener('click', this.togglePlay);
			this.video.addEventListener('play', this.updateButtonState);
			this.video.addEventListener('pause', this.updateButtonState);
			this.updateButtonState(); // Initialize state
		}

		if (this.options.playOnHover) {
			this.element.addEventListener('mouseenter', this.handleMouseEnter);
			this.element.addEventListener('mouseleave', this.handleMouseLeave);
		}
	}

	unmount() {
		if (this.intersectionObserver) {
			this.intersectionObserver.disconnect();
		}

		if (this.playPauseButton) {
			this.playPauseButton.removeEventListener('click', this.togglePlay);
			this.video.removeEventListener('play', this.updateButtonState);
			this.video.removeEventListener('pause', this.updateButtonState);
		}

		if (this.options.playOnHover) {
			this.element.removeEventListener('mouseenter', this.handleMouseEnter);
			this.element.removeEventListener('mouseleave', this.handleMouseLeave);
		}
	}

	handleIntersect(entries) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				if (!this.isManuallyPaused && !this.options.playOnHover) {
					this.playVideo();
				}
			} else {
				this.pauseVideo();
			}
		});
	}

	handleMouseEnter() {
		if (!this.isManuallyPaused) {
			this.playVideo();
		}
	}

	handleMouseLeave() {
		this.pauseVideo();
	}

	playVideo() {
		if (this.video && this.video.paused) {
			// play() returns a promise which might reject if autoplay is blocked or interrupted
			const playPromise = this.video.play();
			if (playPromise !== undefined) {
				playPromise.catch(error => {
					console.warn("Video autoplay blocked or interrupted:", error);
				});
			}
		}
	}

	pauseVideo() {
		if (this.video && !this.video.paused) {
			this.video.pause();
		}
	}

	togglePlay(event) {
		if (event) {
			event.preventDefault();
			event.stopPropagation();
		}

		if (this.video.paused) {
			this.isManuallyPaused = false;
			this.playVideo();
		} else {
			this.isManuallyPaused = true;
			this.pauseVideo();
		}
	}

	updateButtonState() {
		if (!this.playPauseButton) return;

		if (this.video.paused) {
			this.playPauseButton.setAttribute('aria-label', 'Play video');
			this.playPauseButton.classList.remove('is-playing');
			this.playPauseButton.classList.add('is-paused');
			this.playPauseButton.innerHTML = '<span class="sr-only">Play</span><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
		} else {
			this.playPauseButton.setAttribute('aria-label', 'Pause video');
			this.playPauseButton.classList.remove('is-paused');
			this.playPauseButton.classList.add('is-playing');
			this.playPauseButton.innerHTML = '<span class="sr-only">Pause</span><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
		}
	}
}

gia.register(VideoHolder);
