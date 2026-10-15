const globalObj =
	typeof globalThis !== "undefined"
		? globalThis
		: typeof window !== "undefined"
		? window
		: typeof global !== "undefined"
		? global
		: {};

class Config {
	_options = {
		log: false,
		attrPrefix: "data", // data-component="HelloWorld"
		autoMountComponents: false, // Use MutationObserver to automatically mount/unmount components
		autoBindActions: false, // Automatically bind actions using data-action attributes
	};

	set(name, value) {
		this._options[name] = value;
	}

	get(name) {
		return this._options[name];
	}
}

const configInstance = globalObj.__gia_config__ || (globalObj.__gia_config__ = new Config());

export default configInstance;
