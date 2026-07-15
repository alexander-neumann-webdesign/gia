class LightboxGallery extends gia.Component {
	constructor(element) {
		super(element);
		this.ref = {
			triggers: [],
		};
		this.options = {
			bgOpacity: 0.96,
			padding: { top: 48, bottom: 48, left: 12, right: 12 },
			showHideAnimationType: "zoom",
			showAnimationDuration: 360,
			hideAnimationDuration: 300,
			easing: "cubic-bezier(0.75, 0, 0.25, 1)",
			arrowPrevSVG: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-left"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
			arrowNextSVG: `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-right"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`,
			closeSVG: `<svg aria-hidden="true" width="26" height="26" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="1.29289" y1="32.2929" x2="30.2929" y2="3.29289" stroke="black" stroke-width="3"/><line y1="-1" x2="41.0122" y2="-1" transform="matrix(-0.707107 -0.707107 -0.707107 0.707107 31 33)" stroke="black" stroke-width="3"/></svg>`,
			zoomSVG: ``,
		};
		this.photoswipe = null; //stores photoswipe instance
	}

	async require() {
		if (typeof window.PhotoSwipeLightbox === "undefined" || typeof window.PhotoSwipe === "undefined") {
			await Promise.all([
				this.loadScript("photoswipe-lightbox-js", "PhotoSwipeLightbox"),
				this.loadScript("photoswipe-js", "PhotoSwipe"),
				this.loadStyle("photoswipe-css"),
			]);
		}
	}

	mount() {
		if (!this.ref.triggers || this.ref.triggers.length === 0) {
			this.ref.triggers = this.element.querySelectorAll("[data-lightbox]");
		}

		if (!window.PhotoSwipeLightbox || !window.PhotoSwipe) {
			console.error("LightboxGallery: PhotoSwipe is not loaded.");
			return;
		}

		this.photoswipe = new window.PhotoSwipeLightbox(
			Object.assign(
				{
					gallery: this.element,
					children: this.ref.triggers,
					pswpModule: window.PhotoSwipe,
				},
				this.options,
			),
		);

		new CustomObjectPosition(this.photoswipe);

		this.photoswipe.init();

		// Events
		if (typeof window.lenis !== "undefined") {
			this.photoswipe.on("beforeOpen", () => {
				window.lenis.stop();
			});
			this.photoswipe.on("close", () => {
				window.lenis.start();
			});
		}

		// Swup integration: cleanup on page transition
		if (typeof window.swup !== "undefined" && window.swup.hooks) {
			window.swup.hooks.on("animation:out:start", this.handleSwupOut);
		}
	}

	handleSwupOut() {
		if (this.photoswipe) {
			this.photoswipe.destroy();
			this.photoswipe = null;
		}
	}

	unmount() {
		if (typeof window.swup !== "undefined" && window.swup.hooks) {
			// Try to remove the hook listener (swup handles off with same args)
			window.swup.hooks.off("animation:out:start", this.handleSwupOut);
		}

		if (this.photoswipe) {
			this.photoswipe.destroy();
			this.photoswipe = null;
		}
	}

	stateChange(stateChanges) {}
}

class CustomObjectPosition {
	constructor(lightbox) {
		lightbox.addFilter("thumbBounds", (thumbBounds, itemData) => {
			const imageElement = itemData.element.querySelector("img");
			if (!imageElement) return thumbBounds;

			const imageHolderAreaRect = itemData.element.getBoundingClientRect();
			const imageAreaRect = imageElement.getBoundingClientRect();
			const imageProperties = getComputedStyle(imageElement);
			const offsetY = imageProperties.getPropertyValue("top");
			const translate = imageProperties.getPropertyValue("translate") || "0 0";
			const objectPosition = imageProperties.getPropertyValue("object-position") || "50% 50%";

			let translateX = "0";
			let translateY = "0";

			if (translate !== "none") {
				const [tx = "0", ty = "0"] = translate.split(" ");
				translateX = tx;
				translateY = ty;
			}

			const [positionX = "50%", positionY = "50%"] = objectPosition.split(" ");

			const fillZoomLevel = thumbBounds.w / itemData.width;
			const offsetY_float = parseFloat(offsetY);
			const translateY_float = parseFloat(translateY);

			if (positionX !== "50%") {
				const offsetX = this.getCroppedBoundsOffset(positionX, itemData.width, imageAreaRect.width, fillZoomLevel);
				thumbBounds.x = imageAreaRect.left + offsetX;
				thumbBounds.innerRect.x = offsetX;
			}

			if (positionY !== "50%") {
				const offsetY = this.getCroppedBoundsOffset(positionY, itemData.height, imageAreaRect.height, fillZoomLevel);
				thumbBounds.y = imageAreaRect.top + offsetY;
				thumbBounds.innerRect.y = offsetY;
			}

			if (!isNaN(translateY_float) && !isNaN(offsetY_float)) {
				thumbBounds.innerRect.y = thumbBounds.innerRect.y + translateY_float + offsetY_float;
				thumbBounds.innerRect.h = imageHolderAreaRect.height;
			}

			return thumbBounds;
		});
	}

	getCroppedBoundsOffset(position, imageSize, thumbSize, zoomLevel) {
		const float = parseFloat(position);
		return position.includes("%") ? ((thumbSize - imageSize * zoomLevel) * float) / 100 : float;
	}
}

gia.register(LightboxGallery, { priority: -50 });

/*
========================================
EXPECTED HTML
========================================

<div data-component="LightboxGallery">
	<a href="path/to/large/image.jpg"
	   data-lightbox
	   data-pswp-width="1920"
	   data-pswp-height="1080"
	   data-cropped="true"
	   target="_blank" rel="noopener noreferrer">
		<img src="path/to/thumbnail.jpg" alt="" loading="lazy" />
	</a>
</div>

Example PHP (WordPress):
<div data-component="LightboxGallery">
	<?php $image_id = 13; $image_src = wp_get_attachment_image_src($image_id, 'full'); ?>
	<a class="image-holder" data-component="Image" data-parallax data-ref="LightboxGallery:triggers" data-no-swup href="<?= $image_src[0] ?>" data-pswp-width="<?= $image_src[1] ?>" data-pswp-height="<?= $image_src[2] ?>" data-cropped="true" target="_blank" rel="noopener noreferrer" style="">
		<?= wp_get_attachment_image($image_id, 'full', false, ['loading' => 'lazy']) ?>
	</a>
</div>

========================================
SUGGESTED SCSS
========================================

[data-component="LightboxGallery"] {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
	gap: 1rem;

	a {
		display: block;
		position: relative;
		overflow: hidden;
		aspect-ratio: 1 / 1;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
			transition: transform 0.3s ease;
		}

		&:hover img {
			transform: scale(1.05);
		}
	}
}
*/
