class ThemeToggle extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			storageKey: "site-theme",
			lightThemeName: "light",
			darkThemeName: "dark",
			themeAttribute: "data-theme" // Attribute applied to the <html> element
		};

		this.setState({
			theme: "light" // 'light' or 'dark'
		});
	}

	mount() {
		this.element.addEventListener("click", this.handleToggleClick);

		// 1. Check local storage
		const storedTheme = localStorage.getItem(this.options.storageKey);

		if (storedTheme) {
			this.setState({ theme: storedTheme });
		} else {
			// 2. Check system preference if no stored preference
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
			if (prefersDark.matches) {
				this.setState({ theme: this.options.darkThemeName });
			} else {
				this.setState({ theme: this.options.lightThemeName });
			}

			// Optional: listen to system preference changes dynamically
			this.mediaQueryListener = (e) => {
				// Only auto-switch if the user hasn't explicitly set a preference
				if (!localStorage.getItem(this.options.storageKey)) {
					this.setState({ theme: e.matches ? this.options.darkThemeName : this.options.lightThemeName });
				}
			};
			prefersDark.addEventListener("change", this.mediaQueryListener);
		}
	}

	unmount() {
		this.element.removeEventListener("click", this.handleToggleClick);

		if (this.mediaQueryListener) {
			const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
			prefersDark.removeEventListener("change", this.mediaQueryListener);
		}
	}

	handleToggleClick(e) {
		e.preventDefault();
		const newTheme = this.state.theme === this.options.lightThemeName
			? this.options.darkThemeName
			: this.options.lightThemeName;

		this.setState({ theme: newTheme });

		// Save to local storage
		try {
			localStorage.setItem(this.options.storageKey, newTheme);
		} catch (err) {
			console.warn("ThemeToggle: Could not save to localStorage.", err);
		}
	}

	stateChange(stateChanges) {
		if ('theme' in stateChanges) {
			const { theme } = stateChanges;

			// Update the HTML tag
			document.documentElement.setAttribute(this.options.themeAttribute, theme);

			// Update button visual state if needed (e.g., swapping SVG icons)
			if (theme === this.options.darkThemeName) {
				this.element.setAttribute('aria-label', 'Switch to light mode');
			} else {
				this.element.setAttribute('aria-label', 'Switch to dark mode');
			}
		}
	}
}

gia.register(ThemeToggle);

/**
 * Expected HTML Structure:
 *
 * <button data-component="ThemeToggle" aria-label="Toggle dark mode">
 *   <span class="icon-light">☀️</span>
 *   <span class="icon-dark">🌙</span>
 * </button>
 *
 * Suggested SCSS (For the whole site):
 *
 * :root {
 *   --bg-color: #ffffff;
 *   --text-color: #000000;
 * }
 *
 * :root[data-theme="dark"] {
 *   --bg-color: #121212;
 *   --text-color: #ffffff;
 * }
 *
 * body {
 *   background-color: var(--bg-color);
 *   color: var(--text-color);
 *   transition: background-color 0.3s ease, color 0.3s ease;
 * }
 *
 * // For the button itself:
 * button[data-component="ThemeToggle"] {
 *   .icon-light { display: none; }
 *   .icon-dark { display: block; }
 *
 *   &[data-theme="dark"] {
 *     .icon-light { display: block; }
 *     .icon-dark { display: none; }
 *   }
 * }
 */
