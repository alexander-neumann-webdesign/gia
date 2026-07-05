class OffCanvasMenu extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			preventScroll: true,
			mainContentSelector: "main",
			updateLocationHash: false,
		};

		this.setState({
			isOpen: false,
		});

		this.menuId = this.element.id;
		this.triggers = this.menuId ? document.querySelectorAll(`[data-offcanvas-target="${this.menuId}"]`) : [];
		this.closeButtons = this.element.querySelectorAll("[data-offcanvas-close]");
	}

	mount() {
		for (let i = 0; i < this.triggers.length; i++) {
			const trigger = this.triggers[i];
			trigger.addEventListener("click", this.handleTriggerClick);

			if (this.menuId) {
				trigger.setAttribute("aria-controls", this.menuId);
			}

			if (!trigger.hasAttribute("aria-expanded")) {
				trigger.setAttribute("aria-expanded", this.state.isOpen ? "true" : "false");
			}
		}

		for (let i = 0; i < this.closeButtons.length; i++) {
			this.closeButtons[i].addEventListener("click", this.handleCloseClick);
		}

		if (window.swup) {
			window.swup.hooks.on("animation:out:start", this.handleSwupOut);
		}

		const hash = window.location.hash;
		let shouldBeOpen = this.element.classList.contains("is-open");

		if (this.options.updateLocationHash && hash && this.menuId && hash === `#${this.menuId}`) {
			shouldBeOpen = true;
		}

		if (shouldBeOpen) {
			this.setState({ isOpen: true });
		} else {
			this.element.inert = true;
		}
	}

	unmount() {
		if (window.swup) {
			window.swup.hooks.off("animation:out:start", this.handleSwupOut);
		}

		for (let i = 0; i < this.triggers.length; i++) {
			this.triggers[i].removeEventListener("click", this.handleTriggerClick);
		}

		for (let i = 0; i < this.closeButtons.length; i++) {
			this.closeButtons[i].removeEventListener("click", this.handleCloseClick);
		}

		document.removeEventListener("click", this.handleDocumentClick);
		document.removeEventListener("keydown", this.handleKeyDown);

		if (this.state.isOpen) {
			document.documentElement.classList.remove("off-canvas-menu-open");
		}
	}

	handleTriggerClick(e) {
		e.preventDefault();
		this.setState({ isOpen: !this.state.isOpen });
	}

	handleCloseClick(e) {
		e.preventDefault();
		this.setState({ isOpen: false });
	}

	handleDocumentClick(e) {
		if (!this.element.contains(e.target)) {
			let isTriggerClick = false;
			for (let i = 0; i < this.triggers.length; i++) {
				if (this.triggers[i].contains(e.target)) {
					isTriggerClick = true;
					break;
				}
			}

			if (!isTriggerClick) {
				this.setState({ isOpen: false });
			}
		}
	}

	handleKeyDown(e) {
		if (e.key === "Escape") {
			this.setState({ isOpen: false });
		}
	}

	handleSwupOut() {
		if (this.state.isOpen) {
			this.setState({ isOpen: false });
		}
	}

	stateChange(stateChanges) {
		if ("isOpen" in stateChanges) {
			const { isOpen } = stateChanges;

			for (let i = 0; i < this.triggers.length; i++) {
				this.triggers[i].setAttribute("aria-expanded", isOpen ? "true" : "false");
			}

			if (isOpen) {
				this._openMenu();
			} else {
				this._closeMenu();
			}
		}
	}

	_openMenu() {
		this.element.classList.add("is-open");
		this.element.setAttribute("aria-hidden", "false");
		this.element.inert = false;

		document.documentElement.classList.add("off-canvas-menu-open");

		const mainContent = document.querySelector(this.options.mainContentSelector);
		if (mainContent) {
			mainContent.inert = true;
		}

		setTimeout(() => {
			document.addEventListener("click", this.handleDocumentClick);
			document.addEventListener("keydown", this.handleKeyDown);
		}, 0);

		if (this.options.preventScroll && window.lenis) {
			window.lenis.stop();
		}

		if (this.options.updateLocationHash && this.menuId && window.location.hash !== `#${this.menuId}`) {
			history.pushState(null, "", `#${this.menuId}`);
		}
	}

	_closeMenu() {
		if (this.element.contains(document.activeElement)) {
			document.activeElement.blur();
		}

		this.element.classList.remove("is-open");
		this.element.setAttribute("aria-hidden", "true");
		this.element.inert = true;

		document.documentElement.classList.remove("off-canvas-menu-open");

		const mainContent = document.querySelector(this.options.mainContentSelector);
		if (mainContent) {
			mainContent.inert = false;
		}

		document.removeEventListener("click", this.handleDocumentClick);
		document.removeEventListener("keydown", this.handleKeyDown);

		if (this.options.preventScroll && window.lenis) {
			window.lenis.start();
		}

		if (this.options.updateLocationHash && this.menuId && window.location.hash === `#${this.menuId}`) {
			const urlWithoutHash = window.location.pathname + window.location.search;
			history.pushState(null, "", urlWithoutHash || "#");
		}
	}
}

gia.register(OffCanvasMenu);

/*
========================================
EXPECTED HTML
========================================

<header class="site-header">
  <button data-offcanvas-target="main-menu" aria-label="<?= __('Open menu', 'anweb') ?>" aria-expanded="false" aria-controls="main-menu">
    <svg aria-hidden="true" viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg" width="24" height="16">
      <path stroke="currentColor" stroke-width="2" d="M0 1h48" />
      <path stroke="currentColor" stroke-width="2" d="M0 16h48" />
      <path stroke="currentColor" stroke-width="2" d="M0 31h48" />
    </svg>
  </button>
</header>

<div
	data-component="OffCanvasMenu"
	id="off-canvas-menu"
	role="dialog"
	aria-modal="true"
	aria-label="<?= __('Main Navigation', 'anweb') ?>"
	aria-hidden="true">
	<div class="inner-container">
		<nav aria-label="<?= __('Primary', 'anweb') ?>">
			<?php wp_nav_menu(array(
				'menu' => 'off-canvas-menu',
				'theme_location' => 'off-canvas-menu',
				'container' => false,
			)) ?>
		</nav>
	</div>
</div>

<main id="main-content">
</main>

========================================
SUGGESTED SCSS
========================================


html.off-canvas-menu-open {
  body {
    overflow: hidden;
  }
}

#off-canvas-menu {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  max-width: 400px;
  height: 100vh;
  margin: 0;
  padding-top: var(--header-height);
  background: white;
  z-index: 90;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transform: translateX(-100%);
  visibility: hidden;
  transition: transform 0.4s ease, visibility 0.4s;

  &.is-open {
    transform: translateX(0);
    visibility: visible;
  }

  .inner-container {
    padding: 2rem;
    height: 100%;
    overflow-y: auto;
  }
}
*/
