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

		const normalizedText = textToCopy
			.replace(/<br\s*\/?>/gi, "\n")
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n");

		try {
			await navigator.clipboard.writeText(normalizedText);
			this.setState({ status: 'copied' });
		} catch (err) {
			console.error("ClipboardCopy: Failed to copy text: ", err);

			try {
				const textArea = document.createElement("textarea");
				textArea.value = normalizedText;
				textArea.style.position = "fixed";
				textArea.style.left = "-999999px";
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
				console.log("ClipboardCopy: Text copied to clipboard (fallback method)");
				this.setState({ status: 'copied' });
			} catch (fallbackErr) {
				console.error("ClipboardCopy: Fallback method also failed: ", fallbackErr);
				this.setState({ status: 'error' });
			}
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
				this.copyTimeout = setTimeout(() => {
					this.setState({ status: 'idle' });
				}, this.options.successDuration);

			} else if (status === 'idle') {
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

/*
========================================
EXPECTED HTML
========================================

<button data-component="ClipboardCopy" data-copy-text="SAVE20">
  <span class="stack-children">
    <span class="sizer" aria-hidden="true">SAVE20</span>
    <span class="sizer" aria-hidden="true">Copied!</span>
    <span data-ref="buttonText">SAVE20</span>
  </span>
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="clipboard-icon">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" class="copy-icon"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" class="copy-icon"></path>
    <path d="M20 6L9 17l-5-5" class="check-icon" stroke-dasharray="24" stroke-dashoffset="24"></path>
  </svg>
</button>

========================================
SUGGESTED SCSS
========================================

button[data-component="ClipboardCopy"] {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-family: monospace;
  font-size: 1.25rem;
  font-weight: bold;
  color: #333;
  background-color: #f9f9f9;
  border: 2px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  justify-content: center;

  .stack-children {
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;

    > * {
      grid-row-start: 1;
      grid-column-start: 1;
    }

    .sizer {
      visibility: hidden;
      pointer-events: none;
    }
  }

  svg {
    width: 1.25em;
    height: 1.25em;
  }

  .copy-icon {
    transition: opacity 0.3s ease;
    opacity: 1;
  }

  .check-icon {
    transition: stroke-dashoffset 0.4s ease;
    stroke-dasharray: 24;
    stroke-dashoffset: 24;
    stroke: #4caf50;
  }

  &[data-status="copied"] {
    background-color: #e8f5e9;
    border-color: #4caf50;
    color: #4caf50;

    .copy-icon {
      opacity: 0;
    }

    .check-icon {
      stroke-dashoffset: 0;
    }
  }

  &[data-status="error"] {
    background-color: #ffebee;
    border-color: #f44336;
    color: #f44336;
  }
}
*/
