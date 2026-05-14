// import 'babel-regenerator-runtime';
import BaseComponent from "./BaseComponent.js";

/**
 * Component with code splitting support
 */

export default class Component extends BaseComponent {
	async require() {
		/* example: */
		// await Promise.all([
		// 	this.loadScript("vendor/glen-cheney/shuffle.mod", "Shuffle"),
		// 	this.loadScript("vendor/ghiscoding/multiple-select", "multipleSelect"),
		// 	this.loadScript("vendor/fuzzball/fuzzball", "fuzzball"),
		// ]);
	}

	_load() {
		this.require().then(this.mount.bind(this));
	}
}
