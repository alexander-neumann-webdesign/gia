/**
 * Config for setting and changing global settings
 */

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

export default new Config();
