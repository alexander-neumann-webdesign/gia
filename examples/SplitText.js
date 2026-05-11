class SplitText extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			split: ["words", "chars"], // Can be any combination of lines, words, chars
		};

		// Save the original text for accessibility
		this.originalText = this.element.textContent.trim();

		// Initial state variables
		this.words = [];
		this.chars = [];
		this.lines = [];

		// Global counters across all nodes
		this._charIndex = 0;
		this._wordIndex = 0;
		this._lineIndex = 0;
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
				// We only need to recalculate lines, not re-parse the entire DOM tree
				// But to do that cleanly without re-parsing, we need to unwrap old lines first.
				// Since unwrapping is complex, re-running split is safer and usually fast enough for debounced resize.
				this.split();
			}, 100);
		}
	}

	split() {
		// Reset references
		this.words = [];
		this.chars = [];
		this.lines = [];
		this._charIndex = 0;
		this._wordIndex = 0;

		const doLines = this.options.split.indexOf("lines") !== -1;

		// 1. Walk the DOM and replace text nodes with split spans
		// We use a clone to avoid reflows while walking
		const clone = this.element.cloneNode(true);

		// Remove aria-label from clone temporarily to not confuse our walker if it searches for things
		// Actually, walker just goes through childNodes.

		this._walkAndSplit(clone);

		// Apply the DOM
		this.element.innerHTML = "";

		// Move all children from clone to element
		while (clone.firstChild) {
			this.element.appendChild(clone.firstChild);
		}

		// Now process lines if needed
		if (doLines) {
			this.calculateLines();
		}
	}

	_walkAndSplit(node) {
		const childNodes = Array.from(node.childNodes);

		for (let i = 0; i < childNodes.length; i++) {
			const child = childNodes[i];

			if (child.nodeType === Node.TEXT_NODE) {
				// Process text node
				const text = child.nodeValue;

				// Skip completely empty text nodes or nodes that are purely whitespace
				// But preserve standard whitespace flow
				if (!text.trim() && text.length > 0) {
					// It's just whitespace, leave it alone to preserve layout
					continue;
				}

				const fragment = this._processTextNode(text);
				node.replaceChild(fragment, child);

			} else if (child.nodeType === Node.ELEMENT_NODE) {
				// To prevent screen readers from reading the nested contents (since we set aria-label on root)
				// we could set aria-hidden here, but we apply it directly to the spans anyway.
				// Recursive call
				this._walkAndSplit(child);
			}
		}
	}

	_processTextNode(text) {
		const doChars = this.options.split.indexOf("chars") !== -1;
		const doWords = this.options.split.indexOf("words") !== -1 || this.options.split.indexOf("lines") !== -1;

		const fragment = document.createDocumentFragment();

		// Use Intl.Segmenter for word boundaries if available, fallback to regex
		let words = [];
		if (window.Intl && Intl.Segmenter) {
			const segmenter = new Intl.Segmenter(navigator.language || 'en', { granularity: 'word' });
			const segments = segmenter.segment(text);
			for (const segment of segments) {
				words.push({ text: segment.segment, isWordLike: segment.isWordLike });
			}
		} else {
			// Fallback: Split by whitespace but keep the whitespace as separate segments
			// Regex splits by whitespace, capturing the whitespace itself
			const parts = text.split(/(\s+)/);
			for (const part of parts) {
				if (part.length > 0) {
					words.push({ text: part, isWordLike: /\S/.test(part) });
				}
			}
		}

		for (const wordObj of words) {
			const wordText = wordObj.text;

			if (!wordObj.isWordLike || (!wordText.trim() && wordText.length > 0)) {
				// It's whitespace or punctuation that shouldn't be wrapped as a "word" in the animation sense
				// Wait, punctuation attached to words is handled by Segmenter (often separately).
				// If it's just spaces, we definitely just append as text to preserve flow.
				if (!wordText.trim()) {
					fragment.appendChild(document.createTextNode(wordText));
					continue;
				}
			}

			// Even if it's punctuation, we probably want it wrapped as a word/char so it animates.
			// Let's treat non-whitespace as a wrappable element.

			let wordEl;
			if (doWords || doChars) {
				wordEl = document.createElement("span");
				wordEl.className = "split-word";
				wordEl.setAttribute("aria-hidden", "true");
				wordEl.style.display = "inline-block"; // Necessary for word measuring
				wordEl.style.setProperty("--word-index", this._wordIndex++);
				this.words.push(wordEl);
			}

			if (doChars) {
				// Use Intl.Segmenter for graphemes (characters/emojis)
				let chars = [];
				if (window.Intl && Intl.Segmenter) {
					const segmenter = new Intl.Segmenter(navigator.language || 'en', { granularity: 'grapheme' });
					const segments = segmenter.segment(wordText);
					for (const segment of segments) {
						chars.push(segment.segment);
					}
				} else {
					// Fallback: array spread handles some emojis, but not complex grapheme clusters
					chars = [...wordText];
				}

				for (let j = 0; j < chars.length; j++) {
					const charEl = document.createElement("span");
					charEl.className = "split-char";
					charEl.setAttribute("aria-hidden", "true");
					charEl.textContent = chars[j];
					charEl.style.display = "inline-block";
					charEl.style.setProperty("--char-index", this._charIndex++);

					wordEl.appendChild(charEl);
					this.chars.push(charEl);
				}
			} else if (doWords) {
				wordEl.textContent = wordText;
			}

			if (wordEl) {
				fragment.appendChild(wordEl);
			}
		}

		return fragment;
	}

	calculateLines() {
		if (this.words.length === 0) return;

		let currentLine = [];
		let currentTop = null;
		const linesArray = [];

		// Group words into lines by measuring their offsetTop
		for (let i = 0; i < this.words.length; i++) {
			const word = this.words[i];
			const top = word.offsetTop;

			// If currentTop is null (first word) or top has changed by a significant amount (line break)
			if (currentTop === null || Math.abs(currentTop - top) > 2) {
				currentLine = [];
				linesArray.push(currentLine);
				currentTop = top;
			}
			currentLine.push(word);
		}

		// Now wrap the grouped words into line elements.
		// Because we support nested elements, we CANNOT simply wrap words into a block level element,
		// because those words might be deeply nested in different tags (e.g. half a line in <strong>, half in <em>).
		// Moving them into a new <span class="split-line"> would tear them out of their semantic wrappers!

		// To fix this and preserve HTML structure:
		// We will NOT wrap them in a DOM element.
		// Instead, we will assign a CSS variable `--line-index` directly to the `.split-word` or `.split-char` elements.

		for (let i = 0; i < linesArray.length; i++) {
			const lineWords = linesArray[i];

			for (let j = 0; j < lineWords.length; j++) {
				lineWords[j].style.setProperty("--line-index", i);

				// Also pass it down to chars if they exist
				const childChars = lineWords[j].querySelectorAll('.split-char');
				for(let k = 0; k < childChars.length; k++) {
				    childChars[k].style.setProperty("--line-index", i);
				}
			}
		}
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
 *   This is a <strong>sample text</strong> with an 👨‍👩‍👧‍👦 emoji to be split!
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
 * }
 *
 * @keyframes slideUp {
 *   to {
 *     opacity: 1;
 *     transform: translateY(0);
 *   }
 * }
 */
