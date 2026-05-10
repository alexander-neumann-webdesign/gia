/**
 * Expected HTML Structure:
 *
 * <button data-component="ClipboardCopy" data-copy-text="Text to be copied">
 *   <span data-ref="buttonText">Copy Text</span>
 *   <svg>...</svg>
 * </button>
 *
 * Suggested SCSS:
 *
 * button[data-component="ClipboardCopy"] {
 *   transition: background-color 0.3s ease, color 0.3s ease;
 *
 *   &.copied {
 *     background-color: #4caf50;
 *     color: white;
 *   }
 *
 *   &.copy-error {
 *     background-color: #f44336;
 *     color: white;
 *   }
 * }
 */

class ClipboardCopy extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			successDuration: 2000,
			successText: "Copied!",
		};

		this.ref = {
			buttonText: null // looks for data-ref="buttonText", falls back to element.textContent if not found
		};

		this.originalText = "";
		this.copyTimeout = null;

		this.setState({
			status: 'idle' // 'idle', 'copied', 'error'
		});
	}

	mount() {
		this.element.addEventListener("click", this.handleClick);

		if (this.ref.buttonText) {
			this.originalText = this.ref.buttonText.textContent;
		} else {
			this.originalText = this.element.textContent;
		}
	}

	unmount() {
		this.element.removeEventListener("click", this.handleClick);

		if (this.copyTimeout) {
			clearTimeout(this.copyTimeout);
		}
	}

	async handleClick(event) {
		event.preventDefault();

		const textToCopy = this.element.getAttribute("data-copy-text");

		if (!textToCopy) {
			console.warn("ClipboardCopy: No data-copy-text attribute found on the element.");
			return;
		}

		try {
			await navigator.clipboard.writeText(textToCopy);
			this.setState({ status: 'copied' });
		} catch (err) {
			console.error("ClipboardCopy: Failed to copy text: ", err);
			this.setState({ status: 'error' });
		}
	}

	stateChange(stateChanges) {
		if ('status' in stateChanges) {
			const { status } = stateChanges;

			// Clear existing timeout
			if (this.copyTimeout) {
				clearTimeout(this.copyTimeout);
				this.copyTimeout = null;
			}

			// Apply DOM changes based on status
			if (status === 'copied') {
				this.element.classList.add("copied");
				this.element.classList.remove("copy-error");
				this.element.setAttribute("aria-label", this.options.successText);

				if (this.options.successText) {
					if (this.ref.buttonText) {
						this.ref.buttonText.textContent = this.options.successText;
					} else {
						this.element.textContent = this.options.successText;
					}
				}

				this.copyTimeout = setTimeout(() => {
					this.setState({ status: 'idle' });
				}, this.options.successDuration);

			} else if (status === 'error') {
				this.element.classList.add("copy-error");
				this.element.classList.remove("copied");

				this.copyTimeout = setTimeout(() => {
					this.setState({ status: 'idle' });
				}, this.options.successDuration);

			} else if (status === 'idle') {
				this.element.classList.remove("copied");
				this.element.classList.remove("copy-error");
				this.element.removeAttribute("aria-label");

				if (this.ref.buttonText) {
					this.ref.buttonText.textContent = this.originalText;
				} else {
					this.element.textContent = this.originalText;
				}
			}
		}
	}
}

gia.register(ClipboardCopy);
