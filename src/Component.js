import BaseComponent from "./BaseComponent.js";

/**
 * Component with code splitting support: mount() runs after require() resolves.
 */
export default class Component extends BaseComponent {
	async require() {
		/* example: */
		// await Promise.all([
		// 	this.loadScript("vendor/glen-cheney/shuffle.mod", "Shuffle"),
		// 	this.loadScript("vendor/ghiscoding/multiple-select", "multipleSelect"),
		// ]);
	}

	_load() {
		const fail = (err) => {
			console.error(`Gia: Error loading dependencies for "${this._name}".`, err);
		};
		let req;
		try {
			req = this.require();
		} catch (err) {
			fail(err);
			return;
		}
		// BaseComponent._load re-checks that the instance is still alive and catches mount() errors
		if (req && typeof req.then === "function") {
			req.then(() => super._load(), fail);
		} else {
			super._load();
		}
	}
}
