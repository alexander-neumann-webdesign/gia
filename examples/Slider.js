class Slider extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			loop: true,
			align: "center",
			skipSnaps: false
		};

		this.ref = {
			viewport: null, // The embla viewport
			container: null, // The embla container holding the slides
			slide: [], // The slides
			prevBtn: null, // Optional
			nextBtn: null, // Optional
		};

		this.emblaApi = null;

		this.setState({
			canScrollPrev: false,
			canScrollNext: false
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
			await this.loadScript("embla-carousel-js", "EmblaCarousel");
		} catch (error) {
			console.error("Slider: Failed to load Embla Carousel.", error);
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

		// Initialize Embla
		this.emblaApi = window.EmblaCarousel(this.ref.viewport, {
			loop: this.options.loop,
			align: this.options.align,
			skipSnaps: this.options.skipSnaps
		});

		// Setup Buttons
		if (this.ref.prevBtn) {
			this.ref.prevBtn.addEventListener('click', this.scrollPrev);
		}
		if (this.ref.nextBtn) {
			this.ref.nextBtn.addEventListener('click', this.scrollNext);
		}

		// Listen to embla events to update button states
		this.emblaApi.on('select', this.onSelect);
		this.emblaApi.on('reInit', this.onSelect);

		// Initial state
		this.onSelect();
	}

	unmount() {
		if (this.emblaApi) {
			this.emblaApi.destroy();
		}

		if (this.ref.prevBtn) {
			this.ref.prevBtn.removeEventListener('click', this.scrollPrev);
		}
		if (this.ref.nextBtn) {
			this.ref.nextBtn.removeEventListener('click', this.scrollNext);
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
			canScrollNext: this.emblaApi.canScrollNext()
		});
	}

	stateChange(stateChanges) {
		if ('canScrollPrev' in stateChanges && this.ref.prevBtn) {
			if (this.state.canScrollPrev) {
				this.ref.prevBtn.removeAttribute('disabled');
			} else {
				this.ref.prevBtn.setAttribute('disabled', 'disabled');
			}
		}

		if ('canScrollNext' in stateChanges && this.ref.nextBtn) {
			if (this.state.canScrollNext) {
				this.ref.nextBtn.removeAttribute('disabled');
			} else {
				this.ref.nextBtn.setAttribute('disabled', 'disabled');
			}
		}
	}
}

gia.register(Slider);

/**
 * Expected HTML Structure:
 *
 * <!-- Remember to add the vendor script at the bottom of the body: -->
 * <!-- <script id="embla-carousel-js" data-src="vendor/embla/embla-carousel.umd.js"></script> -->
 *
 * <div class="slider-wrapper" data-component="Slider">
 *   <div class="embla" data-ref="viewport">
 *     <div class="embla__container" data-ref="container">
 *       <div class="embla__slide" data-ref="slide">Slide 1</div>
 *       <div class="embla__slide" data-ref="slide">Slide 2</div>
 *       <div class="embla__slide" data-ref="slide">Slide 3</div>
 *     </div>
 *   </div>
 *
 *   <button data-ref="prevBtn" aria-label="Previous slide">Prev</button>
 *   <button data-ref="nextBtn" aria-label="Next slide">Next</button>
 * </div>
 *
 * Suggested SCSS:
 *
 * .slider-wrapper[data-component="Slider"] {
 *   position: relative;
 *   max-width: 100%;
 *
 *   .embla {
 *     overflow: hidden;
 *   }
 *
 *   .embla__container {
 *     display: flex;
 *     touch-action: pan-y pinch-zoom;
 *   }
 *
 *   .embla__slide {
 *     flex: 0 0 100%;
 *     min-width: 0;
 *
 *     @media (min-width: 768px) {
 *       flex: 0 0 50%;
 *     }
 *   }
 *
 *   button {
 *     &:disabled {
 *       opacity: 0.5;
 *       cursor: not-allowed;
 *     }
 *   }
 * }
 */
