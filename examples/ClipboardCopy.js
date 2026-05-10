import Component from "../src/Component.js";

export default class ClipboardCopy extends Component {
	constructor(element) {
		super(element);

		this.options = {
			successDuration: 2000,
			successText: "Copied!",
		};

		this.originalText = "";
		this.copyTimeout = null;

		this.handleClick = this.handleClick.bind(this);
	}

	mount() {
		this.element.addEventListener("click", this.handleClick);

		// Save original text to restore it later if we are changing it on success
		// Assumes a text node or a simple span inside the button.
		const textElement = this.element.querySelector('[data-ref="buttonText"]');
		if (textElement) {
			this.originalText = textElement.textContent;
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
			this.handleSuccess();
		} catch (err) {
			console.error("ClipboardCopy: Failed to copy text: ", err);
			this.handleError();
		}
	}

	handleSuccess() {
		this.element.classList.add("copied");
		this.element.setAttribute("aria-label", this.options.successText);

		const textElement = this.element.querySelector('[data-ref="buttonText"]');
		if (textElement && this.options.successText) {
			textElement.textContent = this.options.successText;
		} else if (this.options.successText) {
			this.element.textContent = this.options.successText;
		}

		if (this.copyTimeout) {
			clearTimeout(this.copyTimeout);
		}

		this.copyTimeout = setTimeout(() => {
			this.resetState();
		}, this.options.successDuration);
	}

	handleError() {
		this.element.classList.add("copy-error");

		if (this.copyTimeout) {
			clearTimeout(this.copyTimeout);
		}

		this.copyTimeout = setTimeout(() => {
			this.resetState();
		}, this.options.successDuration);
	}

	resetState() {
		this.element.classList.remove("copied");
		this.element.classList.remove("copy-error");
		this.element.removeAttribute("aria-label");

		const textElement = this.element.querySelector('[data-ref="buttonText"]');
		if (textElement) {
			textElement.textContent = this.originalText;
		} else {
			this.element.textContent = this.originalText;
		}
	}
}
