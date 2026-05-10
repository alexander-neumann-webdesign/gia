/**
 * Config for setting and changing global settings
 */

class Config {
	_options = {
		log: false,
		attrPrefix: "data", // data-component="HelloWorld"
		autoMountComponents: false, // Use MutationObserver to automatically mount/unmount components
	};

	set(name, value) {
		this._options[name] = value;
	}

	get(name) {
		return this._options[name];
	}
}

export default new Config();
