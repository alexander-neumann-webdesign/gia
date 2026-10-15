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
		try {
			const req = this.require();
			if (req && typeof req.then === "function") {
				req.then(() => {
					if (this.element && !this._isDestroyed) {
						this._isMounted = true;
						this._mountCleanup = this.mount();
					}
				}).catch((err) => {
					console.error(`Gia: Error loading dependencies for "${this._name}".`, err);
				});
			} else {
				if (this.element && !this._isDestroyed) {
					this._isMounted = true;
					this._mountCleanup = this.mount();
				}
			}
		} catch (err) {
			console.error(`Gia: Error loading dependencies for "${this._name}".`, err);
		}
	}
}
