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
			resetBtn: []
		};

		this.options = {
			defaultSort: '', // e.g. 'price:asc'
			activeFilterClass: 'is-active', // Class to apply to active filter buttons
		};

		// Define internal state variables that don't trigger batched DOM updates automatically
		this.activeFilters = {};
		this.activeSort = this.options.defaultSort;

		this.applyChangesDebounced = this.debounce(this.applyChanges.bind(this), 300);
	}

	debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	fuzzyMatch(str, pattern) {
		str = str.toLowerCase();
		pattern = pattern.toLowerCase();

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
		this.ref.item.forEach((item, index) => {
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
		});

		// Parse initial state from URL
		this.parseURL();

		// Add event listeners
		this.bindEvents();

		// Initial synchronous DOM update (no animation)
		this.updateList(false);
	}

	unmount() {
		// Cleanup event listeners
		this.ref.filter.forEach(el => {
			el.removeEventListener('change', this.handleFilterChange);
			el.removeEventListener('input', this.handleFilterChange);
			el.removeEventListener('click', this.handleFilterClick);
		});

		this.ref.sorter.forEach(el => {
			el.removeEventListener('change', this.handleSorterChange);
			el.removeEventListener('click', this.handleSorterClick);
		});

		// Remove popstate listener
		window.removeEventListener('popstate', this.handlePopState);
	}

	bindEvents() {
		this.ref.filter.forEach(el => {
			if (el.tagName === 'SELECT') {
				el.addEventListener('change', this.handleFilterChange);
			} else if (el.tagName === 'INPUT') {
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
		});

		this.ref.sorter.forEach(el => {
			if (el.tagName === 'SELECT') {
				el.addEventListener('change', this.handleSorterChange);
			} else {
				el.addEventListener('click', this.handleSorterClick);
			}
		});

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
		this.ref.filter.forEach(el => {
			const type = el.name || el.getAttribute('data-filter-type');
			if (type) possibleFilterTypes.add(type);
		});

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
		keysToDelete.forEach(key => params.delete(key));

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

		const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${window.location.hash}`;
		window.history.pushState({ path: newUrl }, '', newUrl);
	}

	handleFilterChange(e) {
		const el = e.target;
		const filterType = el.name || el.getAttribute('data-filter-type');

		if (!filterType) return;

		let values = [];
		if (el.tagName === 'SELECT') {
			if (el.multiple) {
				values = Array.from(el.selectedOptions).map(opt => opt.value);
			} else {
				values = el.value ? [el.value] : [];
			}
		} else if (el.tagName === 'INPUT' && el.type === 'checkbox') {
			// This handles a group of checkboxes with the same name
			const checkboxes = this.element.querySelectorAll(`input[name="${filterType}"]:checked`);
			values = Array.from(checkboxes).map(cb => cb.value);
		} else if (el.tagName === 'INPUT' && el.type === 'radio') {
			values = el.value ? [el.value] : [];
		} else if (el.tagName === 'INPUT') {
			// Handle text, search, range, etc.
			values = el.value ? [el.value] : [];
		}

		this.activeFilters[filterType] = values;

		if (e.type === 'input') {
			this.applyChangesDebounced();
		} else {
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

	applyChanges() {
		this.updateURL();
		this.updateList(true);
	}

	updateList(animate = true) {
		// Filter and sort items array without DOM changes
		const items = this.ref.item;
		const visibleItems = [];
		const hiddenItems = [];

		items.forEach(item => {
			let isVisible = true;

			// Check all active filter types
			for (const type in this.activeFilters) {
				const activeValues = this.activeFilters[type];
				if (activeValues && activeValues.length > 0) {
					// Handle special suffix operators
					let baseType = type;
					let operator = 'eq'; // default is exact match

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
							// Case insensitive fuzzy substring search
							if (this.fuzzyMatch(cached.raw, filterVal)) {
								hasMatch = true;
								break;
							}
						} else {
							// Default exact array match
							if (cached.array.includes(filterVal)) {
								hasMatch = true;
								break;
							}
						}
					}

					if (!hasMatch) {
						isVisible = false;
						break; // AND logic between types: fail early
					}
				}
			}

			if (isVisible) {
				visibleItems.push(item);
			} else {
				hiddenItems.push(item);
			}
		});

		// Sort visible items
		if (this.activeSort) {
			const [sortProperty, sortDirection] = this.activeSort.split(':');
			const isDesc = sortDirection === 'desc';

			visibleItems.sort((a, b) => {
				const cacheA = a._dataCache[sortProperty];
				const cacheB = b._dataCache[sortProperty];

				// Handle missing attributes
				if (!cacheA && !cacheB) return a._originalIndex - b._originalIndex;
				if (!cacheA) return isDesc ? 1 : -1;
				if (!cacheB) return isDesc ? -1 : 1;

				// Try numeric sort
				if (!isNaN(cacheA.num) && !isNaN(cacheB.num)) {
					return isDesc ? cacheB.num - cacheA.num : cacheA.num - cacheB.num;
				}

				// Fallback to string sort
				const comp = cacheA.raw.localeCompare(cacheB.raw);
				return isDesc ? -comp : comp;
			});
		} else {
			// Restore original order if no sort is active
			visibleItems.sort((a, b) => a._originalIndex - b._originalIndex);
		}

		// Perform DOM update
		if (animate && document.startViewTransition) {
			const componentId = (this._name || this.constructor.name || 'FilterableList') + '_' + Math.random().toString(36).substring(2, 9);

			// Apply unique names before transition
			visibleItems.concat(hiddenItems).forEach(item => {
				item.style.viewTransitionName = `${componentId}-${item._originalIndex}`;
			});
			this.ref.container.style.viewTransitionName = `${componentId}-container`;

			// Disable full page transitions so pointer events continue to work for controls outside the container
			document.documentElement.style.viewTransitionName = 'none';

			const transition = document.startViewTransition(() => {
				this.applyDOMChangesSynchronously(visibleItems, hiddenItems);
			});

			transition.ready.catch(() => {});
			transition.finished.catch(() => {
				// Ignore AbortError when transition is skipped
			}).finally(() => {
				// Clean up to avoid global namespace pollution
				visibleItems.concat(hiddenItems).forEach(item => {
					item.style.viewTransitionName = '';
				});
				this.ref.container.style.viewTransitionName = '';
				document.documentElement.style.viewTransitionName = '';
			});
		} else {
			this.applyDOMChangesSynchronously(visibleItems, hiddenItems);
		}

		// Trigger setState for batched attributes (like active classes on buttons)
		this.updateControlStates();
	}

	applyDOMChangesSynchronously(visibleItems, hiddenItems) {
		// Update hidden state
		hiddenItems.forEach(item => {
			item.hidden = true;
		});

		visibleItems.forEach(item => {
			item.hidden = false;
		});

		// Reorder visible items in the DOM
		// By appending them in order, they will be moved to the correct position
		visibleItems.forEach(item => {
			this.ref.container.appendChild(item);
		});
	}

	updateControlStates() {
		// Let's use setState to trigger stateChange for UI updates
		this.setState({
			filtersUpdated: Date.now() // Dummy state to trigger stateChange
		});
	}

	stateChange(stateChanges) {
		if ('filtersUpdated' in stateChanges) {
			// Update filter elements
			this.ref.filter.forEach(el => {
				const filterType = el.name || el.getAttribute('data-filter-type');
				if (!filterType) return;

				const activeValues = this.activeFilters[filterType] || [];

				if (el.tagName === 'BUTTON' || el.tagName === 'A') {
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
				} else if (el.tagName === 'SELECT') {
					if (el.multiple) {
						Array.from(el.options).forEach(opt => {
							opt.selected = activeValues.includes(opt.value);
						});
					} else {
						el.value = activeValues.length > 0 ? activeValues[0] : '';
					}
				} else if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
					el.checked = activeValues.includes(el.value);
				} else if (el.tagName === 'INPUT') {
					// Text, search, range, etc.
					const newVal = activeValues.length > 0 ? activeValues[0] : '';
					if (el.value !== newVal) {
						el.value = newVal;
					}
					// Update associated output if it exists (for range inputs)
					if (el.type === 'range' && el.id) {
						const outputEl = document.querySelector(`output[for="${el.id}"]`);
						if (outputEl) {
							outputEl.value = el.value;
						}
					}
				}
			});

			// Update sorter elements
			this.ref.sorter.forEach(el => {
				if (el.tagName === 'SELECT') {
					el.value = this.activeSort;
				} else if (el.tagName === 'BUTTON' || el.tagName === 'A') {
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
			});
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
