class Component {
    constructor() {
        this._state = { a: 1 };
        this._stateAttributeCache = {};
        this.element = { setAttribute: (k, v) => console.log(`setAttribute ${k}=${v}`) };
    }
    stateChange(changes) {
        console.log("stateChange", changes);
    }
	setState(changes) {
		let hasChanges = false;
		let stateChanges = null;

		for (const key in changes) {
			const newValue = changes[key];
			if (this._state[key] !== newValue) {
				if (!hasChanges) {
					hasChanges = true;
					stateChanges = {};
				}
				stateChanges[key] = newValue;
				this._state[key] = newValue;
			}
		}

		if (hasChanges) {
			if (!this._pendingStateChanges) {
				this._pendingStateChanges = {};
				this._pendingAttributeChanges = {};
				setTimeout(() => {
					// Apply batched attribute changes
					for (const attrName in this._pendingAttributeChanges) {
						this.element.setAttribute(attrName, this._pendingAttributeChanges[attrName]);
					}

					this.stateChange(this._pendingStateChanges);
					this._pendingStateChanges = null;
					this._pendingAttributeChanges = null;
				}, 0);
			}

			// Process state changes for attributes
			for (const key in stateChanges) {
				const value = stateChanges[key];
				const type = typeof value;

				if (type === "boolean" || type === "string") {
					let attrName = this._stateAttributeCache[key];
					if (!attrName) {
						// Convert camelCase to kebab-case
						attrName = `data-${key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
						this._stateAttributeCache[key] = attrName;
					}

					this._pendingAttributeChanges[attrName] = type === "boolean" ? (value ? "true" : "false") : value;
				}

				this._pendingStateChanges[key] = value;
			}
		}
	}
}

const c = new Component();
c.setState({ a: 2, isActive: true, camelCaseString: "foo" });
c.setState({ a: 3, isActive: false });

setTimeout(() => {
    console.log("State:", c._state);
}, 100);
