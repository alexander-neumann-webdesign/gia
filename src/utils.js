export function query(selector, context = document) {
	if (typeof selector !== "string") {
		return selector;
	}

	return context.querySelector(selector);
}

export function queryAll(selector, context = document) {
	if (typeof selector !== "string") {
		return selector;
	}

	return context.querySelectorAll(selector);
}

export function toggleClass(element, className, condition = null) {
	if (condition === null) {
		element.classList.toggle(className);
	} else {
		element.classList.toggle(className, !!condition);
	}
}

function modifyClass(nodes, className, action) {
	if (!nodes) return nodes;
	// ⚡ BOLT OPTIMIZATION: Avoid wrapping single nodes in an array [nodes] to prevent
	// unnecessary array memory allocations. We check nodeType to ensure elements
	// with a length property (like <form> or <select>) are still treated as single nodes.
	if (nodes.length !== undefined && nodes.nodeType === undefined) {
		for (let i = 0; i < nodes.length; i++) {
			nodes[i].classList[action](className);
		}
	} else {
		nodes.classList[action](className);
	}
	return nodes;
}

export function removeClass(nodes, className) {
	return modifyClass(nodes, className, "remove");
}

export function addClass(nodes, className) {
	return modifyClass(nodes, className, "add");
}

export function triggerEvent(
	element,
	eventType,
	params = null,
	options = {
		bubbles: true,
		cancelable: true,
		detail: null,
	},
) {
	options.detail = params;
	const event = new CustomEvent(eventType, options);
	element.dispatchEvent(event);
}

export function debounce(func, wait) {
	let timeout;
	let lastArgs = null;
	const later = () => {
		clearTimeout(timeout);
		if (lastArgs) {
			func(...lastArgs);
		}
	};
	const executedFunction = function(...args) {
		lastArgs = args;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
	};
	executedFunction.cancel = function() {
		clearTimeout(timeout);
		lastArgs = null;
	};
	return executedFunction;
}

export function normalizeSearch(str) {
	if (!str) return "";
	return (
		str
			.toLowerCase()
			// Adds a space between a letter and a number (e.g., "box85" -> "box 85")
			.replace(/([a-z])(\d)/g, "$1 $2")
			// Adds a space between a number and a letter (e.g., "85box" -> "85 box")
			.replace(/(\d)([a-z])/g, "$1 $2")
	);
}

export function calculateMinEditDistance(str, pattern) {
	const m = pattern.length;
	const n = str.length;

	// We only need two rows of the DP table
	let prevRow = Array(n + 1).fill(0);
	let currRow = Array(n + 1).fill(0);

	// Initialize first row
	for (let j = 0; j <= n; j++) {
		prevRow[j] = 0; // 0 because we allow the match to start anywhere in `str`
	}

	let minEditDistance = Infinity;

	for (let i = 1; i <= m; i++) {
		currRow[0] = i; // If str is empty, distance is length of pattern prefix
		for (let j = 1; j <= n; j++) {
			if (pattern[i - 1] === str[j - 1]) {
				currRow[j] = prevRow[j - 1];
			} else {
				currRow[j] = 1 + Math.min(
					prevRow[j],     // Deletion
					currRow[j - 1], // Insertion
					prevRow[j - 1]  // Substitution
				);
			}
		}

		// Copy currRow to prevRow for next iteration
		for (let j = 0; j <= n; j++) {
			prevRow[j] = currRow[j];
		}
	}

	// Check the minimum distance in the last row (meaning the full pattern was matched)
	for (let j = 1; j <= n; j++) {
		if (currRow[j] < minEditDistance) {
			minEditDistance = currRow[j];
		}
	}

	return minEditDistance;
}

export function fuzzyMatch(str, pattern) {
	str = normalizeSearch(str);
	pattern = normalizeSearch(pattern);

	// Exact substring match check first (fastest)
	if (str.includes(pattern)) return true;

	// If the pattern is too long or empty, don't fuzzy match
	if (pattern.length === 0 || pattern.length > str.length) return false;

	// Calculate max allowed typos based on pattern length
	// 1 typo for 3-5 chars, 2 typos for 6+ chars
	let maxTypos = 0;
	if (pattern.length >= 3) maxTypos = 1;
	if (pattern.length >= 6) maxTypos = 2;

	if (maxTypos === 0) return false;

	const minEditDistance = calculateMinEditDistance(str, pattern);

	return minEditDistance <= maxTypos;
}
