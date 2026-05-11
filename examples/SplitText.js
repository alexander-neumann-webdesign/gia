class SplitText extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			split: ["words", "chars"], // Can be any combination of lines, words, chars
		};

		this.originalText = this.element.textContent.trim();
		// Initial state variables
		this.words = [];
		this.chars = [];
		this.lines = [];
	}

	mount() {
		// Accessibility: Set aria-label to original text to hide chopped up letters from screen readers
		this.element.setAttribute("aria-label", this.originalText);

		this.split();

		if (this.options.split.indexOf("lines") !== -1) {
			this.observeResize(this.element, this.handleResize);
		}

		// Set initialized state to potentially trigger CSS transitions/visibility
		// BaseComponent auto-maps boolean state to data-[kebab-case] attributes
		this.setState({ initialized: true });
	}

	handleResize() {
		// Only re-split lines if line splitting is active
		if (this.options.split.indexOf("lines") !== -1) {
			// A naive debounce to avoid firing split too rapidly during resize
			if (this.resizeTimeout) {
				clearTimeout(this.resizeTimeout);
			}
			this.resizeTimeout = setTimeout(() => {
				this.split();
			}, 100);
		}
	}

	split() {
		const doChars = this.options.split.indexOf("chars") !== -1;
		const doWords = this.options.split.indexOf("words") !== -1 || this.options.split.indexOf("lines") !== -1;
		const doLines = this.options.split.indexOf("lines") !== -1;

		// Reset references
		this.words = [];
		this.chars = [];
		this.lines = [];

		const fragment = document.createDocumentFragment();
		const wordsArray = this.originalText.split(/\s+/);
		let charIndex = 0;
		let wordIndex = 0;

		for (let i = 0; i < wordsArray.length; i++) {
			const wordText = wordsArray[i];

			// If not doing words or lines, just append text nodes, but wait, if doing chars we still need to wrap chars.
			// Actually, if only doing chars, we can just split all text by empty string and ignore words.
			// But for consistency and simplicity in text wrapping, wrapping in words is usually necessary
			// so the browser can natively line-break between words before we measure lines.

			let wordEl;
			if (doWords || doChars) {
				wordEl = document.createElement("span");
				wordEl.className = "split-word";
				wordEl.setAttribute("aria-hidden", "true");
				wordEl.style.display = "inline-block"; // Necessary for word measuring
				wordEl.style.setProperty("--word-index", wordIndex++);
				this.words.push(wordEl);
			}

			if (doChars) {
				for (let j = 0; j < wordText.length; j++) {
					const charEl = document.createElement("span");
					charEl.className = "split-char";
					charEl.setAttribute("aria-hidden", "true");
					charEl.textContent = wordText[j];
					charEl.style.display = "inline-block";
					charEl.style.setProperty("--char-index", charIndex++);

					wordEl.appendChild(charEl);
					this.chars.push(charEl);
				}
			} else if (doWords) {
				wordEl.textContent = wordText;
			} else {
				// Rare case: only lines, no words or chars? That's technically invalid as lines require words to measure.
				// For safety, fallback to just plain text if neither are selected but somehow split is called
				fragment.appendChild(document.createTextNode(wordText));
			}

			if (wordEl) {
				fragment.appendChild(wordEl);
			}

			// Add space between words to maintain native flow
			if (i < wordsArray.length - 1) {
				fragment.appendChild(document.createTextNode(" "));
			}
		}

		// Apply the DOM
		this.element.innerHTML = "";
		this.element.appendChild(fragment);

		// Now process lines if needed
		if (doLines) {
			this.calculateLines();
		}
	}

	calculateLines() {
		if (this.words.length === 0) return;

		let currentLine = [];
		let currentTop = null;
		const linesArray = [];

		// Group words into lines by measuring their offsetTop
		// Optimization: Use offsetTop instead of getBoundingClientRect for performance
		// and it handles parent offsets nicely when words are inline-block.
		for (let i = 0; i < this.words.length; i++) {
			const word = this.words[i];
			const top = word.offsetTop;

			// If currentTop is null (first word) or top has changed by a significant amount (line break)
			// (Tolerance of 2px to handle subpixel rendering differences)
			if (currentTop === null || Math.abs(currentTop - top) > 2) {
				currentLine = [];
				linesArray.push(currentLine);
				currentTop = top;
			}
			currentLine.push(word);
		}

		// Now wrap the grouped words into line elements
		const fragment = document.createDocumentFragment();
		let lineIndex = 0;

		for (let i = 0; i < linesArray.length; i++) {
			const lineWords = linesArray[i];

			const lineEl = document.createElement("span");
			lineEl.className = "split-line";
			lineEl.style.display = "block"; // Lines are blocks
			lineEl.setAttribute("aria-hidden", "true");
			lineEl.style.setProperty("--line-index", lineIndex++);

			for (let j = 0; j < lineWords.length; j++) {
				lineEl.appendChild(lineWords[j]);
				// Re-insert spaces between words inside the line wrap
				if (j < lineWords.length - 1) {
					lineEl.appendChild(document.createTextNode(" "));
				}
			}

			fragment.appendChild(lineEl);
			this.lines.push(lineEl);
		}

		// Re-apply to DOM
		this.element.innerHTML = "";
		this.element.appendChild(fragment);
	}

	unmount() {
		if (this.resizeTimeout) {
			clearTimeout(this.resizeTimeout);
		}
	}
}

gia.register(SplitText);

/**
 * Expected HTML Structure:
 *
 * <h1 data-component="SplitText" data-options='{"split": ["lines", "words", "chars"]}'>
 *   This is a sample text to be split and animated.
 * </h1>
 *
 * Suggested SCSS:
 *
 * [data-component="SplitText"] {
 *   // Hide the text initially to prevent Flash of Unstyled Content (FOUC)
 *   opacity: 0;
 *   visibility: hidden;
 *
 *   &[data-initialized="true"] {
 *     opacity: 1;
 *     visibility: visible;
 *   }
 *
 *   // Example staggered animation using the generated CSS variables
 *   .split-char {
 *     opacity: 0;
 *     transform: translateY(20px);
 *     animation: slideUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
 *     animation-delay: calc(var(--char-index) * 0.03s);
 *   }
 *
 *   .split-word {
 *      // Prevent awkward wrapping mid-word
 *      display: inline-block;
 *   }
 *
 *   .split-line {
 *      // Ensure lines break correctly and handle overflow if animating transforms
 *      display: block;
 *      overflow: hidden;
 *   }
 * }
 *
 * @keyframes slideUp {
 *   to {
 *     opacity: 1;
 *     transform: translateY(0);
 *   }
 * }
 */
