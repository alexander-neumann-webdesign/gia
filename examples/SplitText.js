class SplitText extends gia.Component {
	constructor(element) {
		super(element);

		this.options = {
			split: ["words"], // Can be any combination of lines, words, chars
			threshold: 0.1,
			rootMargin: "0px",
			once: true,
			wrapLines: false, // Physically wrap lines in a <span class="split-line">
		};

		// Save the original text for accessibility
		this.originalText = this.element.textContent.trim();

		// Initial state variables
		this.words = [];
		this.chars = [];
		this.lines = [];
		this.isSplit = false;
		this._replacements = [];
		this._lineWrappers = [];

		this.setState({
			isInview: false,
		});

		// Global counters across all nodes
		this._charIndex = 0;
		this._wordIndex = 0;
		this._lineIndex = 0;

		// Pre-bind methods for high-frequency callbacks to avoid GC overhead
		// handleResize and handleIntersect are auto-bound by BaseComponent, _applyLineStyles needs manual binding
		this._applyLineStyles = this._applyLineStyles.bind(this);

		// Initialize/Cache Segmenters once for performance
		this._initSegmenters();

		this._isFirstResize = true;
	}

	_initSegmenters() {
		if (window.Intl && Intl.Segmenter) {
			if (!SplitText._graphemeSegmenter) {
				SplitText._graphemeSegmenter = new Intl.Segmenter(navigator.language || "en", { granularity: "grapheme" });
			}
		}
	}

	mount() {
		// Accessibility: Set aria-label to original text to hide chopped up letters from screen readers
		this.element.setAttribute("aria-label", this.originalText);

		const init = () => {
			if (!this.element) return; // Prevent execution if unmounted while waiting for fonts

			this.split();

			if (this.options.split.indexOf("lines") !== -1) {
				this.observeResize(this.element, this.handleResize);
			}

			this.observeIntersection(this.element, this.handleIntersect, {
				threshold: this.options.threshold,
				rootMargin: this.options.rootMargin,
			});

			// Set initialized state to potentially trigger CSS transitions/visibility
			// BaseComponent auto-maps boolean state to data-[kebab-case] attributes,
			// and automatically batches state changes in requestAnimationFrame via mutate().
			this.setState({ initialized: true });
		};

		if (document.fonts && document.fonts.ready) {
			document.fonts.ready.then(init);
		} else {
			init();
		}
	}

	handleIntersect(entries) {
		const entry = entries[entries.length - 1];
		if (!entry) return;

		if (entry.isIntersecting) {
			this.setState({ isInview: true });

			if (this.options.once) {
				this.unobserveIntersection(this.element, this.handleIntersect);
			}
		} else if (!this.options.once) {
			this.setState({ isInview: false });
		}
	}

	handleResize() {
		if (this._isFirstResize) {
			this._isFirstResize = false;
			return; // Initial lines already calculated synchronously in mount() via split()
		}

		if (this.options.split.indexOf("lines") !== -1) {
			// Debounce line recalculation during window resize to prevent layout thrashing
			// (reading offsetTop after writing custom CSS variables in the previous frame)
			clearTimeout(this._resizeTimer);
			this._resizeTimer = setTimeout(() => {
				if (this.options.wrapLines) {
					// Physical blocks break native text reflow, so we must fully revert and resplit
					this.split();
				} else {
					this.calculateLines();
				}
			}, 150);
		}
	}

	split() {
		if (this.isSplit) {
			this.revert();
		}

		// Reset references
		this.words = [];
		this.chars = [];
		this.lines = [];
		this._charIndex = 0;
		this._wordIndex = 0;

		const doLines = this.options.split.indexOf("lines") !== -1;

		// 1. Walk the DOM and replace text nodes with split spans
		// We walk the original element directly instead of a clone.
		// Cloning destroys nested components and event listeners because they are bound to the original DOM nodes.
		this._walkAndSplit(this.element);

		this.isSplit = true;

		// Now process lines if needed
		if (doLines) {
			this.calculateLines();
		}
	}

	revert() {
		if (this._measureTask) {
			gia.clear(this._measureTask);
			this._measureTask = null;
		}
		if (this._mutateTask) {
			gia.clear(this._mutateTask);
			this._mutateTask = null;
		}

		if (!this.isSplit) return;

		// 1. Unwrap physical lines if any
		if (this._lineWrappers) {
			for (const wrapper of this._lineWrappers) {
				if (wrapper.parentNode) {
					const children = Array.from(wrapper.childNodes);
					for (const c of children) {
						wrapper.parentNode.insertBefore(c, wrapper);
					}
					wrapper.parentNode.removeChild(wrapper);
				}
			}
			this._lineWrappers = [];
		}

		// 2. Restore original text nodes
		for (let i = this._replacements.length - 1; i >= 0; i--) {
			const { parent, oldChild, newChildren } = this._replacements[i];
			if (newChildren.length > 0 && parent.contains(newChildren[0])) {
				parent.insertBefore(oldChild, newChildren[0]);
				for (const c of newChildren) {
					parent.removeChild(c);
				}
			} else if (newChildren.length === 0) {
				parent.appendChild(oldChild);
			}
		}

		this._replacements = [];
		this.words = [];
		this.chars = [];
		this.lines = [];
		this.isSplit = false;
		this._charIndex = 0;
		this._wordIndex = 0;
		this._lineIndex = 0;
	}

	_walkAndSplit(node) {
		let child = node.firstChild;
		while (child) {
			const next = child.nextSibling;

			if (child.nodeType === Node.TEXT_NODE) {
				// Process text node
				const text = child.nodeValue;

				// Skip completely empty text nodes or nodes that are purely whitespace
				// But preserve standard whitespace flow
				if (!text.trim() && text.length > 0) {
					// It's just whitespace, leave it alone to preserve layout
					child = next;
					continue;
				}

				const fragment = this._processTextNode(text);
				const newChildren = Array.from(fragment.childNodes);
				node.replaceChild(fragment, child);
				this._replacements.push({ parent: node, oldChild: child, newChildren });
			} else if (child.nodeType === Node.ELEMENT_NODE) {
				// To prevent screen readers from reading the nested contents (since we set aria-label on root)
				// we could set aria-hidden here, but we apply it directly to the spans anyway.
				// Recursive call
				this._walkAndSplit(child);
			}

			child = next;
		}
	}

	_tokenizeWords(text) {
		let words = [];
		// Use regex split to preserve punctuation attached to words.
		// Intl.Segmenter separates punctuation, creating unwanted detached single-character spans.
		const parts = text.split(/(\s+)/);
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (part.length > 0) {
				// Micro-optimization: part.trim().length is faster than Regex /\S/.test() in a tight loop
				words.push({ text: part, isWordLike: part.trim().length > 0 });
			}
		}
		return words;
	}

	_tokenizeChars(wordText) {
		let chars = [];
		if (SplitText._graphemeSegmenter) {
			const segments = SplitText._graphemeSegmenter.segment(wordText);
			for (const segment of segments) {
				chars.push(segment.segment);
			}
		} else {
			// Robust fallback for older browsers (like Firefox < 112) that lack Intl.Segmenter.
			// This regex (inspired by GSAP) handles complex emojis (ZWS, flags, family emojis).
			// We use `new RegExp` to prevent SyntaxErrors during script compilation on very old browsers.
			try {
				const emojiRegex = new RegExp("\\p{RI}\\p{RI}|\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?(\\u{200D}\\p{Emoji}(\\p{EMod}|\\u{FE0F}\\u{20E3}?|[\\u{E0020}-\\u{E007E}]+\\u{E007F})?)*|.", "gu");
				let match;
				while ((match = emojiRegex.exec(wordText)) !== null) {
					chars.push(match[0]);
				}
			} catch(e) {
				// Ultimate fallback if Unicode Property Escapes (\p{}) aren't supported
				chars = [...wordText];
			}
		}
		return chars;
	}

	_processTextNode(text) {
		const doChars = this.options.split.indexOf("chars") !== -1;
		const doWords = this.options.split.indexOf("words") !== -1 || this.options.split.indexOf("lines") !== -1;

		const fragment = document.createDocumentFragment();

		// Use Intl.Segmenter for word boundaries if available, fallback to regex
		let words = this._tokenizeWords(text);

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
				let chars = this._tokenizeChars(wordText);

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
		if (this.ticking) return; // Prevent concurrent recalculations during rapid resizing

		this.ticking = true;

		this._measureTask = gia.measure(() => {
			// Phase 1: STRICT DOM READS
			// We read all offsets into an array first to prevent layout thrashing (forced reflows)
			const offsetTops = new Array(this.words.length);
			for (let i = 0; i < this.words.length; i++) {
				offsetTops[i] = this.words[i].offsetTop;
			}

			// Group words into lines based on cached offsets
			let currentLine = [];
			let currentTop = null;
			const linesArray = [];

			for (let i = 0; i < this.words.length; i++) {
				const word = this.words[i];
				const top = offsetTops[i];

				if (currentTop === null || Math.abs(currentTop - top) > 2) {
					currentLine = [];
					linesArray.push(currentLine);
					currentTop = top;
				}
				currentLine.push(word);
			}

			// Phase 2: STRICT DOM WRITES
			// Defer applying styles until the next frame to keep main thread unblocked
			this._linesArrayToApply = linesArray;
			this._mutateTask = gia.mutate(this._applyLineStyles);
		});
	}

	_applyLineStyles() {
		if (!this._linesArrayToApply) return;

		for (let i = 0; i < this._linesArrayToApply.length; i++) {
			const lineWords = this._linesArrayToApply[i];

			for (let j = 0; j < lineWords.length; j++) {
				const wordEl = lineWords[j];

				if (wordEl._currentLineIndex !== i) {
					wordEl.style.setProperty("--line-index", i);
					wordEl._currentLineIndex = i;
				}

				// Instead of querySelectorAll (which is a read operation), we iterate children directly
				// if they exist, since we know we appended .split-char spans as direct children.
				const children = wordEl.children;
				for (let k = 0; k < children.length; k++) {
					const child = children[k];
					// Micro-optimization: We know all children are split-chars, 
					// so we can skip the expensive child.classList.contains("split-char") check
					if (child._currentLineIndex !== i) {
						child.style.setProperty("--line-index", i);
						child._currentLineIndex = i;
					}
				}
			}
		}

		if (this.options.wrapLines) {
			this._wrapLinesPhysically(this._linesArrayToApply);
		}

		this._linesArrayToApply = null;
		this.ticking = false;
	}

	_wrapLinesPhysically(linesArray) {
		this._lineWrappers = [];
		for (let i = 0; i < linesArray.length; i++) {
			const lineWords = linesArray[i];
			if (lineWords.length === 0) continue;

			const firstWord = lineWords[0];
			const lastWord = lineWords[lineWords.length - 1];

			// Only wrap if they share the same parent to avoid breaking nested DOM structures
			if (firstWord.parentNode && firstWord.parentNode === lastWord.parentNode) {
				const parent = firstWord.parentNode;
				const lineWrapper = document.createElement("span");
				lineWrapper.className = "split-line";
				lineWrapper.style.display = "block"; // Lines are blocks
				lineWrapper.style.setProperty("--line-index", i);

				parent.insertBefore(lineWrapper, firstWord);

				let currentNode = firstWord;
				let reachedLast = false;
				const nodesToMove = [];
				
				while (currentNode) {
					nodesToMove.push(currentNode);
					if (currentNode === lastWord) {
						reachedLast = true;
						break;
					}
					currentNode = currentNode.nextSibling;
				}

				if (reachedLast) {
					for (const node of nodesToMove) {
						lineWrapper.appendChild(node);
					}
					this._lineWrappers.push(lineWrapper);
				} else {
					lineWrapper.remove();
				}
			}
		}
	}

	unmount() {
		this.ticking = false;
		if (this._measureTask) gia.clear(this._measureTask);
		if (this._mutateTask) gia.clear(this._mutateTask);
		clearTimeout(this._resizeTimer);
		this.revert();
		this.element.removeAttribute("aria-label");
	}
}

gia.register(SplitText);

/*
========================================
EXPECTED HTML
========================================

<h1 data-component="SplitText" data-options='{"split": ["lines", "words", "chars"]}'>
  This is a <strong>sample text</strong> with an 👨👩👧👦 emoji to be split!
</h1>

========================================
SUGGESTED SCSS
========================================

[data-component="SplitText"] {
  // Hide the text initially to prevent Flash of Unstyled Content (FOUC)
  opacity: 0;
  visibility: hidden;

  &[data-initialized="true"] {
    opacity: 1;
    visibility: visible;
  }

  // Example staggered animation triggered when scrolled into view
  &[data-is-inview="true"] {
    .split-char {
      animation: slideUp 0.5s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      animation-delay: calc(var(--char-index) * 0.03s);
    }
  }

  .split-char {
    opacity: 0;
    transform: translateY(20px);
  }

  .split-word {
     // Prevent awkward wrapping mid-word
     display: inline-block;
  }
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
*/
