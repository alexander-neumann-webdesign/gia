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
			if (el.tagName === 'SELECT' || el.tagName === 'INPUT') {
				el.addEventListener('change', this.handleFilterChange);
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
		}

		this.activeFilters[filterType] = values;

		this.applyChanges();
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
					const cached = item._dataCache[type];

					if (!cached) {
						isVisible = false;
						break;
					}

					let hasMatch = false;
					for (let i = 0; i < activeValues.length; i++) {
						if (cached.array.includes(activeValues[i])) {
							hasMatch = true;
							break;
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
			// Update filter buttons
			this.ref.filter.forEach(el => {
				if (el.tagName !== 'BUTTON' && el.tagName !== 'A') return;

				const filterType = el.getAttribute('data-filter-type');
				const filterValue = el.getAttribute('data-filter-value');

				if (!filterType) return;

				const activeValues = this.activeFilters[filterType] || [];

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
			});

			// Update sorter buttons
			this.ref.sorter.forEach(el => {
				if (el.tagName !== 'BUTTON' && el.tagName !== 'A') return;

				const sortValue = el.getAttribute('data-sort-value');
				const isActive = this.activeSort === sortValue;

				if (isActive) {
					el.classList.add(this.options.activeFilterClass);
					el.setAttribute('aria-selected', 'true');
				} else {
					el.classList.remove(this.options.activeFilterClass);
					el.setAttribute('aria-selected', 'false');
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
