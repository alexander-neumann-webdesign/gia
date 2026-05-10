import config from "./config";
import { queryAll } from "./utils";

/**
 * Component without code splitting support
 */

export default class Component {
	constructor(element, options) {
		this.element = element;
		this.element.__gia_component__ = this;
		this._name = this.constructor.name;
		this._ref = {};
		this._options = options || {};
		this._state = {};
		this._autoBindFunctions();
		this._autoBindActions();
	}

	get ref() {
		return this._ref;
	}

	set ref(items) {
		const attrName = `${config.get("attrPrefix")}-ref`;
		const allRefs = queryAll(`[${attrName}]`, this.element);

		const refsByName = {};
		for (let i = 0; i < allRefs.length; i++) {
			const element = allRefs[i];
			const refName = element.getAttribute(attrName);
			if (!refsByName[refName]) {
				refsByName[refName] = [];
			}
			refsByName[refName].push(element);
		}

		if (Object.keys(items).length === 0) {
			allRefs.forEach((element) => {
				const refName = element.getAttribute(attrName);
				if (refName.includes(":")) {
					const [componentName, actualRefName] = refName.split(":");
					if (componentName === this._name && !this._ref[actualRefName]) {
						this._ref[actualRefName] = refsByName[refName];
					}
				} else {
					if (!this._ref[refName]) {
						this._ref[refName] = refsByName[refName];
					}
				}
			});
		} else {
			this._ref = Object.keys(items).reduce((acc, key) => {
				const isArray = Array.isArray(items[key]);

				if (items[key] !== null && isArray && items[key].length > 0) {
					acc[key] = items[key];
					return acc;
				}

				const prefixedName = `${this._name}:${key}`;
				let refs = refsByName[prefixedName] || [];

				if (refs.length === 0) {
					refs = refsByName[key] || [];
				}

				acc[key] = isArray ? refs : (refs[0] ?? null);
				return acc;
			}, {});
		}
	}

	get options() {
		return this._options;
	}

	set options(defaults) {
		const optionsFromAttribute = this.element.getAttribute(`${config.get("attrPrefix")}-options`);
		let options = {};
		if (optionsFromAttribute) {
			try {
				options = JSON.parse(optionsFromAttribute);
			} catch (e) {
				console.error(`Failed to parse options for component "${this._name}": ${e.message}`);
			}
		}

		this._options = {
			...this._options,
			...defaults,
			...options,
		};

		// return this._options;
	}

	get state() {
		return this._state;
	}

	set state(state) {
		console.warn("Use setState instead.");
		this._state = state;
	}

	_load() {
		this.mount();
	}

	/**
	 * Loads a script that is already defined in the DOM with a data-src attribute.
	 * Prevents double-loading and handles race conditions.
	 * * @param {string} scriptId - The ID of the script tag (without "-js" suffix)
	 * @param {string} [globalName] - Optional: The global variable this script exposes (e.g. "multipleSelect")
	 * @return {Promise}
	 */
	loadScript(scriptId, globalName) {
		// SAFETY CHECK: Is the library already active globally?
		// If 'window.multipleSelect' exists, we don't need to do anything.
		if (globalName && window[globalName]) {
			return Promise.resolve(window[globalName]);
		}

		// 2. DOM LOOKUP: Find the existing script tag
		const script = document.getElementById(`${scriptId}-js`);
		if (!script) {
			return Promise.reject(new Error(`Script tag with ID '${scriptId}-js' not found.`));
		}

		// CACHE CHECK: Did we already start loading this?
		// If another component triggered this 5ms ago, return that same running promise.
		if (script._loadPromise) {
			return script._loadPromise;
		}

		// START LOADING
		script._loadPromise = new Promise((resolve, reject) => {
			// Define cleanup to avoid memory leaks
			const cleanup = () => {
				script.onload = null;
				script.onerror = null;
			};

			script.onload = () => {
				cleanup();
				resolve(globalName ? window[globalName] : true);
			};

			script.onerror = () => {
				cleanup();
				// Delete the promise so we can try again later if needed
				delete script._loadPromise;
				reject(new Error(`Failed to load script: ${scriptId}`));
			};

			// TRIGGER: Move data-src to src if not already done
			// If script.src is already set, the browser is likely already downloading it.
			// We still attach the listeners above to catch the completion event.
			if (!script.src && script.dataset.src) {
				script.src = script.dataset.src;
				// Clean up the data attribute to keep DOM tidy (optional)
				delete script.dataset.src;
			} else if (!script.src && !script.dataset.src) {
				// Edge case: Tag exists but has no source at all
				cleanup();
				reject(new Error(`Script tag '${scriptId}-js' has no src or data-src.`));
			}
		});

		return script._loadPromise;
	}

	mount() {
		// this is here only to be rewritten
		// console.warn(`Component ${this._name} does not have "mount" method.`);
	}

	unmount() {
		// this is here only to be rewritten
	}

	getRef(ref, prefixed = false) {
		return `[${config.get("attrPrefix")}-ref="${prefixed ? `${this._name}:` : ""}${ref}"]`;
	}

	setState(changes) {
		const stateChanges = {};
		let hasChanges = false;

		Object.keys(changes).forEach((key) => {
			if (this._state[key] !== changes[key]) {
				stateChanges[key] = changes[key];
				this._state[key] = changes[key];
				hasChanges = true;
			}
		});

		if (hasChanges) {
			if (!this._pendingStateChanges) {
				this._pendingStateChanges = {};
				requestAnimationFrame(() => {
					this.stateChange(this._pendingStateChanges);
					this._pendingStateChanges = null;
				});
			}
			Object.assign(this._pendingStateChanges, stateChanges);
		}
	}

	stateChange(stateChanges) {
		// this is here only to be rewritten
		// console.warn(`Component ${this._name} does not have "stateChange" method.`);
		return stateChanges;
	}

	_autoBindFunctions() {
		// Get all methods defined on the child class (e.g., FilteredList)
		const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this));

		const excludedMethods = new Set(["constructor", "require", "mount", "unmount", "getRef", "setState", "stateChange", "loadScript"]);

		methods.forEach((method) => {
			// Filter out standard things we shouldn't bind
			if (
				excludedMethods.has(method) ||
				method.startsWith("_") // Convention: ignore private helpers? (Optional)
			) {
				return;
			}

			// Bind the method to the instance
			// Check if it is actually a function before binding
			if (typeof this[method] === "function") {
				this[method] = this[method].bind(this);
			}
		});
	}

	_autoBindActions() {
		// Find all elements with data-action inside this component
		const actionElements = this.element.querySelectorAll("[data-action]");

		actionElements.forEach((el) => {
			const actions = el.dataset.action.split(" "); // Allow multiple: "click->doX hover->doY"
			actions.forEach((pair) => {
				const [event, method] = pair.split("->");
				if (this[method]) {
					// Bind the event and ensure 'this' refers to the component instance
					el.addEventListener(event, (e) => this[method](e));
				} else {
					console.warn(`Method "${method}" not found in component.`);
				}
			});
		});
	}
}
