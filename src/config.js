
class Config {
	// Assigned in the constructor, not as a class field: the build target lowers class fields
	// to a defineProperty helper that every bundle would otherwise carry
	constructor() {
		this._options = {
			attrPrefix: "data", // data-component="HelloWorld"
			autoMountComponents: false, // Use MutationObserver to automatically mount/unmount components
			autoBindActions: false, // Automatically bind actions using data-action attributes
		};
	}

	set(name, value) {
		this._options[name] = value;
	}

	get(name) {
		return this._options[name];
	}
}

// Shared by every Gia bundle on the page (globalThis is the window in browsers)
const configInstance = globalThis.__gia_config__ || (globalThis.__gia_config__ = new Config());

export default configInstance;
