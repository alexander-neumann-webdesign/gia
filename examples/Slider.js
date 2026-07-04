class Slider extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			loop: true,
			align: "center",
			skipSnaps: true,
			tween: false,
			parallax: false,
			wheelGestures: true,
		};

		this.ref = {
			viewport: null, // The embla viewport
			container: null, // The embla container holding the slides
			slide: [], // The slides
			prevBtn: null, // Optional
			nextBtn: null, // Optional
			dotsContainer: null, // Optional container for dots
			dot: [], // Dynamically generated dots
		};

		this.emblaApi = null;
		this._slideNodes = [];
		this._tweenFactor = 0;
		this._parallaxMultiplier = 0;

		this.setState({
			canScrollPrev: false,
			canScrollNext: false,
		});
	}

	async require() {
		// Asynchronously load the Embla Carousel UMD script.
		// Fallback to loading from unpkg if you don't host it locally yet,
		// but ideally you'd serve it from your vendor directory as requested.

		// This uses gia's built-in loadScript helper, assuming you've added
		// <script id="embla-carousel-js" data-src="vendor/embla/embla-carousel.umd.js"></script>
		// to the bottom of your HTML.
		try {
			await this.loadScript("vendor/embla/embla-carousel.umd-js", "EmblaCarousel");
		} catch (error) {
			console.error("Slider: Failed to load Embla Carousel.", error);
		}

		if (this.options.wheelGestures) {
			try {
				await this.loadScript("vendor/embla/embla-carousel-wheel-gestures.anweb.umd-js", "EmblaCarouselWheelGestures");
			} catch (error) {
				console.error("Slider: Failed to load Embla Carousel Wheel Gestures.", error);
			}
		}
	}

	mount() {
		if (!this.ref.viewport) {
			console.warn("Slider: Missing data-ref='viewport' element.");
			return;
		}

		if (typeof window.EmblaCarousel === "undefined") {
			console.error("Slider: EmblaCarousel is not defined on window.");
			return;
		}

		// Plugins
		const plugins = [];
		if (this.options.wheelGestures && typeof window.EmblaCarouselWheelGestures !== "undefined") {
			plugins.push(window.EmblaCarouselWheelGestures());
		}

		// Initialize Embla
		this.emblaApi = window.EmblaCarousel(
			this.ref.viewport,
			{
				loop: this.options.loop,
				align: this.options.align,
				skipSnaps: this.options.skipSnaps,
			},
			plugins,
		);

		// Setup Buttons
		if (this.ref.prevBtn) {
			this.ref.prevBtn.addEventListener("click", this.scrollPrev);
		}
		if (this.ref.nextBtn) {
			this.ref.nextBtn.addEventListener("click", this.scrollNext);
		}

		// Listen to embla events to update button states
		this.emblaApi.on("select", this.onSelect);
		this.emblaApi.on("reInit", this.onSelect);

		if (this.ref.dotsContainer) {
			this.setupDots();
		}

		if (this.options.tween) {
			this.setupTween();
		}

		if (this.options.parallax) {
			this.setupParallax();
		}

		// Initial state
		this.onSelect();
	}

	_applyEmblaEffect(embla, eventName, applyCallback) {
		const engine = embla.internalEngine();
		const scrollProgress = embla.scrollProgress();
		const slidesInView = embla.slidesInView();
		const isScrollEvent = eventName === "scroll";

		const scrollSnapList = embla.scrollSnapList();
		const loopPoints = engine.options.loop ? engine.slideLooper.loopPoints : null;

		for (let snapIndex = 0; snapIndex < scrollSnapList.length; snapIndex++) {
			const scrollSnap = scrollSnapList[snapIndex];
			const slidesInSnap = engine.slideRegistry[snapIndex];

			for (let i = 0; i < slidesInSnap.length; i++) {
				const slideIndex = slidesInSnap[i];

				if (isScrollEvent && !slidesInView.includes(slideIndex)) continue;

				let diffToTarget = scrollSnap - scrollProgress;

				if (loopPoints) {
					for (let j = 0; j < loopPoints.length; j++) {
						const loopItem = loopPoints[j];
						const target = loopItem.target();

						if (slideIndex === loopItem.index && target !== 0) {
							const sign = Math.sign(target);

							if (sign === -1) {
								diffToTarget = scrollSnap - (1 + scrollProgress);
							} else if (sign === 1) {
								diffToTarget = scrollSnap + (1 - scrollProgress);
							}
						}
					}
				}

				applyCallback(slideIndex, diffToTarget);
			}
		}
	}

	setSlideNodes() {
		if (this.emblaApi) this._slideNodes = this.emblaApi.slideNodes();
	}

	setTweenFactor() {
		if (this.emblaApi) this._tweenFactor = 0.8 * this.emblaApi.scrollSnapList().length;
	}

	tweenOpacityCallback(slideIndex, diffToTarget) {
		const tweenValue = 1 - Math.abs(diffToTarget * this._tweenFactor);
		const opacity = Math.max(0, Math.min(tweenValue, 1));

		// Round to 4 decimal places to prevent micro-stutters and garbage collection thrashing
		const roundedOpacity = Math.round(opacity * 10000) / 10000;
		this._slideNodes[slideIndex].style.setProperty("--card-slide-visibility", roundedOpacity.toString());
	}

	tweenOpacity(embla, eventName) {
		this._applyEmblaEffect(embla, eventName, this.tweenOpacityCallback);
	}

	setupTween() {
		if (!this.emblaApi) return;

		this.setSlideNodes();
		this.setTweenFactor();
		this.tweenOpacity(this.emblaApi);

		this.emblaApi
			.on("reInit", this.setSlideNodes)
			.on("reInit", this.setTweenFactor)
			.on("reInit", this.tweenOpacity)
			.on("scroll", this.tweenOpacity)
			.on("slideFocus", this.tweenOpacity);
	}

	setParallaxMultiplier() {
		// Precompute the -1 and 100 multiplication here so we don't do it 60fps per slide
		if (this.emblaApi) this._parallaxMultiplier = -20 * this.emblaApi.scrollSnapList().length;
	}

	applyParallaxCallback(slideIndex, diffToTarget) {
		const translate = Math.round(diffToTarget * this._parallaxMultiplier * 1000) / 1000;
		this._slideNodes[slideIndex].style.setProperty("--slide-parallax-x", `${translate}%`);
	}

	applyParallax(embla, eventName) {
		this._applyEmblaEffect(embla, eventName, this.applyParallaxCallback);
	}

	setupParallax() {
		if (!this.emblaApi) return;

		this.setSlideNodes();
		this.setParallaxMultiplier();
		this.applyParallax(this.emblaApi);

		this.emblaApi
			.on("reInit", this.setSlideNodes)
			.on("reInit", this.setParallaxMultiplier)
			.on("reInit", this.applyParallax)
			.on("scroll", this.applyParallax)
			.on("slideFocus", this.applyParallax);
	}

	handleDotClick(e) {
		const index = parseInt(e.currentTarget.getAttribute("data-index"), 10);
		if (this.emblaApi) this.emblaApi.scrollTo(index);
	}

	setupDots() {
		if (!this.emblaApi) return;

		const scrollSnaps = this.emblaApi.scrollSnapList();
		this.ref.dot = scrollSnaps.map((_, index) => {
			const dot = document.createElement("button");
			dot.classList.add("embla__dot");
			dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
			dot.setAttribute("data-index", index);
			dot.tabIndex = 0;
			dot.addEventListener("click", this.handleDotClick);
			this.ref.dotsContainer.appendChild(dot);
			return dot;
		});

		this.emblaApi.on("scroll", this.updateDots);
		this.emblaApi.on("select", this.updateDots);
		this.emblaApi.on("reInit", this.updateDots);
		this.updateDots();
	}

	updateDots() {
		if (!this.emblaApi || !this.ref.dot) return;

		let selected = this.emblaApi.selectedScrollSnap();
		const progress = this.emblaApi.scrollProgress();
		const snapList = this.emblaApi.scrollSnapList();

		if (snapList && snapList.length > 0 && typeof progress === "number") {
			let minDiff = Infinity;
			for (let i = 0; i < snapList.length; i++) {
				const diff = Math.abs(snapList[i] - progress);
				if (diff < minDiff) {
					minDiff = diff;
					selected = i;
				}
			}
		}

		// ⚡ BOLT OPTIMIZATION: Only touch the DOM if the active dot actually changed
		if (this._lastSelectedDot === selected) return;
		this._lastSelectedDot = selected;

		for (let index = 0; index < this.ref.dot.length; index++) {
			const dot = this.ref.dot[index];
			if (index === selected) {
				dot.classList.add("is-selected");
				dot.setAttribute("aria-current", "true");
				dot.tabIndex = -1;
			} else {
				dot.classList.remove("is-selected");
				dot.removeAttribute("aria-current");
				dot.tabIndex = 0;
			}
		}
	}

	unmount() {
		if (this.emblaApi) {
			this.emblaApi.destroy();
		}

		if (this.ref.prevBtn) {
			this.ref.prevBtn.removeEventListener("click", this.scrollPrev);
		}
		if (this.ref.nextBtn) {
			this.ref.nextBtn.removeEventListener("click", this.scrollNext);
		}

		if (this.ref.dotsContainer && this.ref.dot) {
			for (let i = 0; i < this.ref.dot.length; i++) {
				this.ref.dot[i].remove();
			}
			this.ref.dot = [];
		}
	}

	scrollPrev(e) {
		if (e) e.preventDefault();
		if (this.emblaApi) this.emblaApi.scrollPrev();
	}

	scrollNext(e) {
		if (e) e.preventDefault();
		if (this.emblaApi) this.emblaApi.scrollNext();
	}

	onSelect() {
		if (!this.emblaApi) return;

		this.setState({
			canScrollPrev: this.emblaApi.canScrollPrev(),
			canScrollNext: this.emblaApi.canScrollNext(),
		});
	}

	stateChange(stateChanges) {
		if ("canScrollPrev" in stateChanges && this.ref.prevBtn) {
			if (this.state.canScrollPrev) {
				this.ref.prevBtn.removeAttribute("disabled");
			} else {
				this.ref.prevBtn.setAttribute("disabled", "disabled");
			}
		}

		if ("canScrollNext" in stateChanges && this.ref.nextBtn) {
			if (this.state.canScrollNext) {
				this.ref.nextBtn.removeAttribute("disabled");
			} else {
				this.ref.nextBtn.setAttribute("disabled", "disabled");
			}
		}
	}
}

gia.register(Slider);

/*
========================================
EXPECTED HTML
========================================

<!-- Remember to add the vendor script at the bottom of the body: -->
<!-- <script id="embla-carousel-js" data-src="vendor/embla/embla-carousel.umd.js"></script> -->

<div class="slider-wrapper" data-component="Slider">
  <div class="embla" data-ref="viewport">
    <div class="embla__container" data-ref="container">
      <div class="embla__slide" data-ref="slide">Slide 1</div>
      <div class="embla__slide" data-ref="slide">Slide 2</div>
      <div class="embla__slide" data-ref="slide">Slide 3</div>
    </div>
  </div>

  <button data-ref="prevBtn" aria-label="Previous slide">Prev</button>
  <button data-ref="nextBtn" aria-label="Next slide">Next</button>
</div>

========================================
SUGGESTED SCSS
========================================

.slider-wrapper[data-component="Slider"] {
  position: relative;
  max-width: 100%;

  .embla {
    overflow: hidden;
  }

  .embla__container {
    display: flex;
    touch-action: pan-y pinch-zoom;
  }

  .embla__slide {
    flex: 0 0 100%;
    min-width: 0;

    @media (min-width: 768px) {
      flex: 0 0 50%;
    }
  }

  button {
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}
*/
