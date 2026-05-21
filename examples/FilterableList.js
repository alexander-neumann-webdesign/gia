class FilterableList extends gia.Component {
	constructor(element) {
		super(element);

		this.ref = {
			item: [],      // The items to filter and sort
			container: null, // The wrapper for items. Defaults to this.element if not provided
			filter: [],    // The filter controls (selects, inputs, buttons)
			sorter: [],    // The sort controls
			announcer: null, // Optional aria-live region to announce results count
			announcerCount: [],
			announcerSingular: null,
			announcerPlural: null,
			announcerEmpty: null,
			resetBtn: [],
			showMoreBtn: null,
			showMoreBtnCount: null
		};

		this.options = {
			defaultSort: '', // e.g. 'price:asc'
			activeFilterClass: 'is-active', // Class to apply to active filter buttons
			staggerDelay: 20, // ms delay per item for the shuffle animation
			maxStaggerDelay: null, // max delay in ms (defaults to staggerDelay * 12)
			maxItemCount: -1, // max items to show initially, -1 for all
		};

		// Define internal state variables that don't trigger batched DOM updates automatically
		this.activeFilters = {};
		this.activeSort = this.options.defaultSort;

		this.applyChangesDebounced = this.debounce(this.applyChanges.bind(this), 300);

		this._pendingOutputs = new Map();
		this._outputRafId = null;
		this._syncOutputs = this._syncOutputs.bind(this);
		this.handleResetClick = this.handleResetClick.bind(this);
		this.handleShowMoreClick = this.handleShowMoreClick.bind(this);
	}

	_syncOutputs() {
		for (const [id, value] of this._pendingOutputs.entries()) {
			const outputEl = document.querySelector(`output[for="${id}"]`);
			if (outputEl && outputEl.value !== value) {
				outputEl.value = value;
			}
		}
		this._pendingOutputs.clear();
		this._outputRafId = null;
	}

	debounce(func, wait) {
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


	normalizeSearch(str) {
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

	fuzzyMatch(str, pattern) {
		str = this.normalizeSearch(str);
		pattern = this.normalizeSearch(pattern);

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

		// Simple edit distance algorithm
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

		return minEditDistance <= maxTypos;
	}

	mount() {
		// Fallback for container
		if (!this.ref.container) {
			this.ref.container = this.element;
		}

		if (this.ref.item.length === 0) {
			console.warn("FilterableList component is missing items.");
			return;
		}

		// Save the original index of each item to preserve stable sorting when values are equal
		for (let index = 0; index < this.ref.item.length; index++) {
			const item = this.ref.item[index];
			item._originalIndex = index;
			item._dataCache = {};

			for (let i = 0; i < item.attributes.length; i++) {
				const attr = item.attributes[i];
				if (attr.name.startsWith('data-')) {
					const key = attr.name.replace('data-', '');
					const val = attr.value;

					let parsedVal;
					if (val.startsWith('[') && val.endsWith(']')) {
						try {
							parsedVal = JSON.parse(val);
							if (!Array.isArray(parsedVal)) parsedVal = [parsedVal.toString()];
						} catch (e) {
							parsedVal = [val];
						}
					} else {
						parsedVal = [val];
					}

					item._dataCache[key] = {
						array: parsedVal,
						raw: val,
						num: parseFloat(val)
					};
				}
			}
		}

		// Parse initial state from URL
		this.parseURL();

		// Add event listeners
		this.bindEvents();

		// Initial synchronous DOM update (no animation)
		this.updateList(false);
	}

	unmount() {
		// Cleanup event listeners
		for (let i = 0; i < this.ref.filter.length; i++) {
			const el = this.ref.filter[i];
			el.removeEventListener('change', this.handleFilterChange);
			el.removeEventListener('input', this.handleFilterChange);
			el.removeEventListener('click', this.handleFilterClick);
		}

		for (let i = 0; i < this.ref.sorter.length; i++) {
			const el = this.ref.sorter[i];
			el.removeEventListener('change', this.handleSorterChange);
			el.removeEventListener('click', this.handleSorterClick);
		}

		// Remove popstate listener
		for (let i = 0; i < this.ref.resetBtn.length; i++) {
			this.ref.resetBtn[i].removeEventListener('click', this.handleResetClick);
		}

		if (this.ref.showMoreBtn) {
			this.ref.showMoreBtn.removeEventListener('click', this.handleShowMoreClick);
		}

		window.removeEventListener('popstate', this.handlePopState);

		if (this._outputRafId) {
			cancelAnimationFrame(this._outputRafId);
			this._outputRafId = null;
		}
	}

	bindEvents() {
		for (let i = 0; i < this.ref.filter.length; i++) {
			const el = this.ref.filter[i];
			if (el instanceof HTMLSelectElement) {
				el.addEventListener('change', this.handleFilterChange);
			} else if (el instanceof HTMLInputElement) {
				if (el.type === 'checkbox' || el.type === 'radio') {
					el.addEventListener('change', this.handleFilterChange);
				} else {
					// Use input event for real-time updates on text and range inputs
					el.addEventListener('input', this.handleFilterChange);
					el.addEventListener('change', this.handleFilterChange);
				}
			} else {
				el.addEventListener('click', this.handleFilterClick);
			}
		}

		for (let i = 0; i < this.ref.sorter.length; i++) {
			const el = this.ref.sorter[i];
			if (el instanceof HTMLSelectElement) {
				el.addEventListener('change', this.handleSorterChange);
			} else {
				el.addEventListener('click', this.handleSorterClick);
			}
		}

		for (let i = 0; i < this.ref.resetBtn.length; i++) {
			this.ref.resetBtn[i].addEventListener('click', this.handleResetClick);
		}

		if (this.ref.showMoreBtn) {
			this.ref.showMoreBtn.addEventListener('click', this.handleShowMoreClick);
		}

		window.addEventListener('popstate', this.handlePopState);
	}

	handlePopState(e) {
		this.parseURL();
		this.updateList(false); // No animation on back/forward to preserve scroll
	}

	parseURL() {
		const params = new URLSearchParams(window.location.search);
		this.activeFilters = {};
		this.activeSort = params.get('sort') || this.options.defaultSort;


		const possibleFilterTypes = new Set();
		for (let i = 0; i < this.ref.filter.length; i++) {
			const el = this.ref.filter[i];
			const type = el.name || el.getAttribute('data-filter-type');
			if (type) possibleFilterTypes.add(type);
		}

		if (params.get('all') === 'true') {
			this.options.maxItemCount = -1;
		}

		for (const [key, value] of params.entries()) {
			if (key.startsWith('filter-')) {
				const filterType = key.replace('filter-', '');
				if (possibleFilterTypes.has(filterType)) {
					this.activeFilters[filterType] = value.split(',').filter(Boolean);
				}
			}
		}
	}

	updateURL() {
		const params = new URLSearchParams(window.location.search);

		// Remove all existing filter query params (any starting with 'filter-')
		const keysToDelete = [];
		for (const key of params.keys()) {
			if (key.startsWith('filter-')) {
				keysToDelete.push(key);
			}
		}
		for (let i = 0; i < keysToDelete.length; i++) {
			params.delete(keysToDelete[i]);
		}

		// Set new filters
		for (const [key, values] of Object.entries(this.activeFilters)) {
			if (values && values.length > 0) {
				params.set(`filter-${key}`, values.join(','));
			}
		}

		if (this.activeSort && this.activeSort !== this.options.defaultSort) {
			params.set('sort', this.activeSort);
		} else {
			params.delete('sort');
		}

		if (this.options.maxItemCount === -1 && this.ref.showMoreBtn) {
			params.set('all', 'true');
		} else {
			params.delete('all');
		}

		const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${window.location.hash}`;
		window.history.pushState({ path: newUrl }, '', newUrl);
	}

	handleFilterChange(e) {
		const el = e.target;
		const filterType = el.name || el.getAttribute('data-filter-type');

		if (!filterType) return;

		let values = [];
		if (el instanceof HTMLSelectElement) {
			if (el.multiple) {
				for (let i = 0; i < el.selectedOptions.length; i++) {
					values.push(el.selectedOptions[i].value);
				}
			} else {
				values = el.value ? [el.value] : [];
			}
		} else if (el instanceof HTMLInputElement && el.type === 'checkbox') {
			// This handles a group of checkboxes with the same name
			const checkboxes = this.element.querySelectorAll(`input[name="${filterType}"]:checked`);
			for (let i = 0; i < checkboxes.length; i++) {
				values.push(checkboxes[i].value);
			}
		} else if (el instanceof HTMLInputElement && el.type === 'radio') {
			values = el.value ? [el.value] : [];
		} else if (el instanceof HTMLInputElement) {
			// Handle text, search, range, etc.
			values = el.value ? [el.value] : [];
			if (el.type === 'range' && el.value === el.defaultValue) {
				values = [];
			}
		}

		this.activeFilters[filterType] = values;

		if (e.type === 'input') {
			if (el.type === 'range' && el.id) {
				this._pendingOutputs.set(el.id, el.value);
				if (!this._outputRafId) {
					this._outputRafId = requestAnimationFrame(this._syncOutputs);
				}
			}
			this.applyChangesDebounced();
		} else {
			this.applyChangesDebounced.cancel();
			this.applyChanges();
		}
	}

	handleFilterClick(e) {
		const el = e.currentTarget;
		const filterType = el.getAttribute('data-filter-type');
		const filterValue = el.getAttribute('data-filter-value');

		if (!filterType) return;

		if (!this.activeFilters[filterType]) {
			this.activeFilters[filterType] = [];
		}

		if (filterValue === '*' || filterValue === 'all' || !filterValue) {
			this.activeFilters[filterType] = [];
		} else {
			const index = this.activeFilters[filterType].indexOf(filterValue);
			// Toggle value
			if (index > -1) {
				this.activeFilters[filterType].splice(index, 1);
			} else {
				this.activeFilters[filterType].push(filterValue);
			}
		}

		this.applyChanges();
	}

	handleSorterChange(e) {
		this.activeSort = e.target.value;
		this.applyChanges();
	}

	handleSorterClick(e) {
		const el = e.currentTarget;
		const sortValue = el.getAttribute('data-sort-value');

		if (sortValue) {
			this.activeSort = sortValue;
			this.applyChanges();
		}
	}

	handleResetClick(e) {
		e.preventDefault();
		this.activeFilters = {};
		this.applyChanges();
	}

	handleShowMoreClick(e) {
		e.preventDefault();
		const maxItemCountBefore = this.options.maxItemCount;
		this.options.maxItemCount = -1;

		if (this.ref.showMoreBtn) {
			this.ref.showMoreBtn.style.display = "none";
			this.ref.showMoreBtn.tabIndex = -1;
		}

		this.applyChanges();

		window.setTimeout(() => {
			// Find the first visible item that was previously hidden
			let visibleIndex = 0;
			for (let i = 0; i < this.ref.item.length; i++) {
				if (!this.ref.item[i].hidden) {
					if (visibleIndex === maxItemCountBefore) {
						const focusableElement = this.ref.item[i].querySelector("a, button, input, [tabindex]");
						if (focusableElement) {
							focusableElement.focus();
						}
						break;
					}
					visibleIndex++;
				}
			}
		}, 250);
	}

	applyChanges() {
		this.updateURL();
		this.updateList(true);
	}

	_filterItems(items) {
		const visibleItems = [];
		const hiddenItems = [];
		let currentItemsVisibleCount = 0;
		let currentItemsHiddenBehindMoreButtonCount = 0;

		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			let isVisible = true;

			for (const type in this.activeFilters) {
				const activeValues = this.activeFilters[type];
				if (activeValues && activeValues.length > 0) {
					let baseType = type;
					let operator = 'eq';

					if (type.endsWith('-min')) {
						baseType = type.replace('-min', '');
						operator = 'min';
					} else if (type.endsWith('-max')) {
						baseType = type.replace('-max', '');
						operator = 'max';
					} else if (type.endsWith('-includes')) {
						baseType = type.replace('-includes', '');
						operator = 'includes';
					}

					const cached = item._dataCache[baseType];
					if (!cached) {
						isVisible = false;
						break;
					}

					let hasMatch = false;
					for (let i = 0; i < activeValues.length; i++) {
						const filterVal = activeValues[i];

						if (operator === 'min') {
							const numFilterVal = parseFloat(filterVal);
							if (!isNaN(cached.num) && !isNaN(numFilterVal) && cached.num >= numFilterVal) {
								hasMatch = true;
								break;
							}
						} else if (operator === 'max') {
							const numFilterVal = parseFloat(filterVal);
							if (!isNaN(cached.num) && !isNaN(numFilterVal) && cached.num <= numFilterVal) {
								hasMatch = true;
								break;
							}
						} else if (operator === 'includes') {
							if (this.fuzzyMatch(cached.raw, filterVal)) {
								hasMatch = true;
								break;
							}
						} else {
							if (cached.array.includes(filterVal)) {
								hasMatch = true;
								break;
							}
						}
					}

					if (!hasMatch) {
						isVisible = false;
						break;
					}
				}
			}

			if (isVisible) {
				if (this.options.maxItemCount > 0 && currentItemsVisibleCount >= this.options.maxItemCount) {
					currentItemsHiddenBehindMoreButtonCount++;
					hiddenItems.push(item);
				} else {
					currentItemsVisibleCount++;
					visibleItems.push(item);
				}
			} else {
				hiddenItems.push(item);
			}
		}

		return { visibleItems, hiddenItems, currentItemsHiddenBehindMoreButtonCount };
	}

	_updateShowMoreVisibility(hiddenBehindMoreCount) {
		if (this.ref.showMoreBtn) {
			if (this.options.maxItemCount === -1) {
				this.ref.showMoreBtn.classList.remove("visible");
			} else if (hiddenBehindMoreCount > 0) {
				this.ref.showMoreBtn.classList.add("visible");
				if (this.ref.showMoreBtnCount) {
					this.ref.showMoreBtnCount.textContent = hiddenBehindMoreCount;
				}
			} else {
				this.ref.showMoreBtn.classList.remove("visible");
			}
		}
	}

	_sortItems(visibleItems) {
		if (this.activeSort) {
			const [sortProperty, sortDirection] = this.activeSort.split(':');
			const isDesc = sortDirection === 'desc';

			visibleItems.sort((a, b) => {
				const cacheA = a._dataCache[sortProperty];
				const cacheB = b._dataCache[sortProperty];

				if (!cacheA && !cacheB) return a._originalIndex - b._originalIndex;
				if (!cacheA) return isDesc ? 1 : -1;
				if (!cacheB) return isDesc ? -1 : 1;

				if (!isNaN(cacheA.num) && !isNaN(cacheB.num)) {
					return isDesc ? cacheB.num - cacheA.num : cacheA.num - cacheB.num;
				}

				const comp = cacheA.raw.localeCompare(cacheB.raw);
				return isDesc ? -comp : comp;
			});
		} else {
			visibleItems.sort((a, b) => a._originalIndex - b._originalIndex);
		}
	}

	_cancelOngoingAnimations() {
		if (this._currentTransition) {
			this._currentTransition.skipTransition();
		}
		if (this._heightAnimation) {
			this._heightAnimation.cancel();
			this._heightAnimation = null;
		}
	}

	_applyViewTransition(visibleItems, hiddenItems) {
		// Temporarily disable CSS transitions and apply DOM changes to measure target height
		this.ref.container.style.transition = 'none';
		const initialHeight = this.ref.container.offsetHeight;

		const componentId = (this._name || this.constructor.name || 'FilterableList') + '_' + Math.random().toString(36).substring(2, 9);
		let staggerCss = '';
		let staggerIndex = 0;

		if (this.ref.announcer) {
			const announcerName = `${componentId}-announcer`;
			this.ref.announcer.style.viewTransitionName = announcerName;
			staggerCss += `::view-transition-group(${announcerName}) { animation-duration: 0.4s; animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1); }\n`;
		}

		const maxDelay = this.options.maxStaggerDelay !== null && this.options.maxStaggerDelay !== undefined
			? this.options.maxStaggerDelay
			: this.options.staggerDelay * 12;

		// Apply unique names before transition
		for (let i = 0; i < visibleItems.length; i++) {
			const vName = `${componentId}-${visibleItems[i]._originalIndex}`;
			visibleItems[i].style.viewTransitionName = vName;
			const zIndex = visibleItems.length - i;
			staggerCss += `::view-transition-group(${vName}) { z-index: ${zIndex}; }\n`;

			if (this.options.staggerDelay > 0) {
				const delay = Math.min(staggerIndex * this.options.staggerDelay, maxDelay);
				staggerCss += `::view-transition-group(${vName}), ::view-transition-old(${vName}), ::view-transition-new(${vName}) { animation-delay: ${delay}ms; animation-fill-mode: both; }\n`;
				staggerIndex++;
			}
		}
		for (let i = 0; i < hiddenItems.length; i++) {
			const vName = `${componentId}-${hiddenItems[i]._originalIndex}`;
			hiddenItems[i].style.viewTransitionName = vName;
			if (this.options.staggerDelay > 0) {
				const delay = Math.min(staggerIndex * this.options.staggerDelay, maxDelay);
				staggerCss += `::view-transition-group(${vName}), ::view-transition-old(${vName}), ::view-transition-new(${vName}) { animation-delay: ${delay}ms; animation-fill-mode: both; }\n`;
				staggerIndex++;
			}
		}

		let styleEl = null;
		if (staggerCss) {
			styleEl = document.createElement('style');
			styleEl.textContent = staggerCss;
			document.head.appendChild(styleEl);
		}

		// Disable full page transitions so pointer events continue to work for controls outside the container
		document.documentElement.style.viewTransitionName = 'none';

		const transition = document.startViewTransition(() => {
			this.applyDOMChangesSynchronously(visibleItems, hiddenItems);
		});
		this._currentTransition = transition;

		let heightAnimation = null;

		transition.ready.then(() => {
			const targetHeight = this.ref.container.offsetHeight;
			if (initialHeight !== targetHeight) {
				heightAnimation = this.ref.container.animate(
					[
						{ height: `${initialHeight}px` },
						{ height: `${targetHeight}px` }
					],
					{
						duration: 400,
						easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
						fill: 'forwards'
					}
				);
				if (this._currentTransition === transition) {
					this._heightAnimation = heightAnimation;
				} else {
					heightAnimation.cancel();
				}
			}
		}).catch(() => {});

		transition.finished.catch(() => {
			// Ignore AbortError when transition is skipped
		}).finally(() => {
			if (this._currentTransition === transition) {
				this.ref.container.style.transition = '';
			}

			if (this._heightAnimation === heightAnimation && heightAnimation) {
				heightAnimation.cancel();
				this._heightAnimation = null;
			}

			if (styleEl) {
				styleEl.remove();
			}
			if (this._currentTransition === transition) {
				// Clean up to avoid global namespace pollution
				for (let i = 0; i < visibleItems.length; i++) {
					visibleItems[i].style.viewTransitionName = '';
				}
				if (this.ref.announcer) {
					this.ref.announcer.style.viewTransitionName = '';
				}
				document.documentElement.style.viewTransitionName = '';
				this._currentTransition = null;
			}
		});
	}

	updateList(animate = true) {
		this._cancelOngoingAnimations();

		const items = this.ref.item;
		const { visibleItems, hiddenItems, currentItemsHiddenBehindMoreButtonCount } = this._filterItems(items);

		this._updateShowMoreVisibility(currentItemsHiddenBehindMoreButtonCount);
		this._sortItems(visibleItems);

		// Perform DOM update
		if (animate && document.startViewTransition) {
			this._applyViewTransition(visibleItems, hiddenItems);
		} else {
			this.applyDOMChangesSynchronously(visibleItems, hiddenItems);
		}

		// Trigger setState for batched attributes (like active classes on buttons)
		this.updateControlStates(visibleItems.length);
	}

	applyDOMChangesSynchronously(visibleItems, hiddenItems) {
		// Update hidden state
		for (let i = 0; i < hiddenItems.length; i++) {
			hiddenItems[i].style.viewTransitionName = '';
			hiddenItems[i].hidden = true;
		}

		for (let i = 0; i < visibleItems.length; i++) {
			visibleItems[i].hidden = false;
		}

		// Reorder visible items in the DOM
		// By appending them in order, they will be moved to the correct position
		for (let i = 0; i < visibleItems.length; i++) {
			this.ref.container.appendChild(visibleItems[i]);
		}

		const count = visibleItems.length;

		for (let i = 0; i < this.ref.announcerCount.length; i++) {
			this.ref.announcerCount[i].textContent = count;
		}

		if (this.ref.announcerSingular) {
			this.ref.announcerSingular.hidden = count !== 1;
		}

		if (this.ref.announcerPlural) {
			this.ref.announcerPlural.hidden = count === 1 || count === 0;
		}

		if (this.ref.announcerEmpty) {
			this.ref.announcerEmpty.hidden = count > 0;
		}
	}

	updateControlStates(visibleCount) {
		// Let's use setState to trigger stateChange for UI updates
		this.setState({
			filtersUpdated: Date.now(), // Dummy state to trigger stateChange
		});
	}

	stateChange(stateChanges) {
		if ('filtersUpdated' in stateChanges) {
			// Update filter elements
			for (let i = 0; i < this.ref.filter.length; i++) {
				const el = this.ref.filter[i];
				const filterType = el.name || el.getAttribute('data-filter-type');
				if (!filterType) continue;

				const activeValues = this.activeFilters[filterType] || [];

				if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) {
					const filterValue = el.getAttribute('data-filter-value');
					let isActive = false;
					if (filterValue === '*' || filterValue === 'all' || !filterValue) {
						isActive = activeValues.length === 0;
					} else {
						isActive = activeValues.includes(filterValue);
					}

					if (isActive) {
						el.classList.add(this.options.activeFilterClass);
						el.setAttribute('aria-pressed', 'true');
					} else {
						el.classList.remove(this.options.activeFilterClass);
						el.setAttribute('aria-pressed', 'false');
					}
				} else if (el instanceof HTMLSelectElement) {
					if (el.multiple) {
						for (let j = 0; j < el.options.length; j++) {
							const opt = el.options[j];
							opt.selected = activeValues.includes(opt.value);
						}
					} else {
						el.value = activeValues.length > 0 ? activeValues[0] : '';
					}
				} else if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
					el.checked = activeValues.includes(el.value);
				} else if (el instanceof HTMLInputElement) {
					// Text, search, range, etc.
					let newVal = '';
					if (activeValues.length > 0) {
						newVal = activeValues[0];
					} else {
						newVal = el.type === 'range' ? (el.defaultValue || '') : '';
					}

					let isDifferent = false;
					if (el.type === 'range' || el.type === 'number') {
						const num1 = parseFloat(el.value);
						const num2 = parseFloat(newVal);
						// Handle empty strings causing NaN !== NaN
						if (isNaN(num1) && isNaN(num2)) {
							isDifferent = String(el.value) !== String(newVal);
						} else {
							isDifferent = num1 !== num2;
						}
					} else {
						isDifferent = el.value !== String(newVal);
					}

					if (isDifferent) {
						el.value = newVal;
						el.dispatchEvent(new Event('change', { bubbles: true }));
					}
					// Update associated output if it exists (for range inputs)
					if (el.type === 'range' && el.id) {
						const outputEl = document.querySelector(`output[for="${el.id}"]`);
						if (outputEl && outputEl.value !== el.value) {
							outputEl.value = el.value;
						}
					}
				}
			}

			// Update sorter elements
			for (let i = 0; i < this.ref.sorter.length; i++) {
				const el = this.ref.sorter[i];
				if (el instanceof HTMLSelectElement) {
					el.value = this.activeSort;
				} else if (el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement) {
					const sortValue = el.getAttribute('data-sort-value');
					const isActive = this.activeSort === sortValue;

					if (isActive) {
						el.classList.add(this.options.activeFilterClass);
						el.setAttribute('aria-selected', 'true');
					} else {
						el.classList.remove(this.options.activeFilterClass);
						el.setAttribute('aria-selected', 'false');
					}
				}
			}
		}
	}
}

gia.register(FilterableList);

/**
 * Expected HTML Structure:
 *
 * <div data-component="FilterableList" data-options='{"defaultSort": "name:asc"}'>
 *   <div class="controls">
 *     <!-- Filter Controls -->
 *     <button data-ref="filter" data-filter-type="shape" data-filter-value="*">All Shapes</button>
 *     <button data-ref="filter" data-filter-type="shape" data-filter-value="circle">Circle</button>
 *     <button data-ref="filter" data-filter-type="shape" data-filter-value="square">Square</button>
 *     <button data-ref="filter" data-filter-type="shape" data-filter-value="triangle">Triangle</button>
 *
 *     <button data-ref="filter" data-filter-type="color" data-filter-value="red">Red</button>
 *     <button data-ref="filter" data-filter-type="color" data-filter-value="blue">Blue</button>
 *     <button data-ref="filter" data-filter-type="color" data-filter-value="green">Green</button>
 *     <button data-ref="filter" data-filter-type="color" data-filter-value="yellow">Yellow</button>
 *
 *     <!-- Sorter Controls -->
 *     <select data-ref="sorter">
 *       <option value="name:asc">Name (A-Z)</option>
 *       <option value="name:desc">Name (Z-A)</option>
 *       <option value="price:asc">Price (Low-High)</option>
 *       <option value="price:desc">Price (High-Low)</option>
 *     </select>
 *   </div>
 *
 *   <div data-ref="container" class="grid">
 *     <div class="item" data-ref="item" data-shape="circle" data-color="red" data-name="Apple" data-price="10">
 *       <div class="shape-visual" data-shape="circle" data-color="red"></div>
 *       <div class="item-details">
 *         <span class="item-name">Apple</span>
 *         <span class="price-tag">$10</span>
 *       </div>
 *     </div>
 *     <div class="item" data-ref="item" data-shape="square" data-color="blue" data-name="Box" data-price="20">
 *       <div class="shape-visual" data-shape="square" data-color="blue"></div>
 *       <div class="item-details">
 *         <span class="item-name">Box</span>
 *         <span class="price-tag">$20</span>
 *       </div>
 *     </div>
 *     <!-- Add more items as needed (min 12 for good demo) -->
 *   </div>
 * </div>
 *
 * Preventing Layout Shift on Initial Load:
 * When the component loads with URL parameters, the browser will initially paint all items,
 * and then the JS will hide the mismatched items, causing a layout shift.
 * To prevent this, you should pre-filter the items on the server before rendering the HTML.
 *
 * Example PHP (WordPress) Server-Side Pre-filtering:
 * <?php
 * // Parse active filters dynamically based on the 'filter-' prefix
 * $active_filters = [];
 * foreach ($_GET as $key => $value) {
 *   if (strpos($key, 'filter-') === 0 && !empty($value)) {
 *     $filter_type = str_replace('filter-', '', $key);
 *     $active_filters[$filter_type] = explode(',', $value);
 *   }
 * }
 * ?>
 * <!-- Inside your loop -->
 * <?php
 * $is_hidden = false;
 * foreach ($active_filters as $type => $values) {
 *   $item_value = get_field($type); // Or however you retrieve item attributes
 *   if (!in_array($item_value, $values)) {
 *     $is_hidden = true;
 *     break;
 *   }
 * }
 * ?>
 * <div class="item" <?php if ($is_hidden) echo 'hidden'; ?> data-shape="<?php echo get_field('shape'); ?>">...</div>
 *
 * Alternatively, if server-side filtering is not possible, place a blocking inline <script>
 * right before the component to inject a <style> tag that hides mismatched items.
 *
 * Suggested SCSS:
 *
 * :root {
 *   interpolate-size: allow-keywords;
 * }
 *
 * div[data-component="FilterableList"] {
 *   .grid {
 *     display: grid;
 *     grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
 *     gap: 1rem;
 *     transition: height 0.4s ease;
 *   }
 *
 *   .item[hidden] {
 *     display: none !important;
 *   }
 *
 *   // View transitions styles
 *   ::view-transition {
 *     pointer-events: none;
 *   }
 *
 *   ::view-transition-group(*) {
 *     animation-duration: 0.4s;
 *     animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
 *   }
 * }
 */
