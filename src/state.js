import { mutate } from "./scheduler.js";

/**
 * Batched state updates and attribute syncing.
 */

let isRafQueued = false;
const dirtyComponents = [];
const globalStateAttributeCache = new Map();

function flushGlobalStateChanges() {
	isRafQueued = false;
	// ⚡ BOLT OPTIMIZATION: Process all dirty components in a single mutate block
	// ⚡ BOLT OPTIMIZATION: Use classic for loop over Array instead of Set.forEach to prevent iterator allocation
	for (let i = 0; i < dirtyComponents.length; i++) {
		dirtyComponents[i]._flushStateChanges();
	}
	dirtyComponents.length = 0;
}

/**
 * Batches state changes and queues a render task via the scheduler.
 * @param {object} instance - Component instance
 * @param {object} changes - Key/value state updates
 */
export function enqueueSetState(instance, changes) {
	if (!instance.element || !instance._isMounted || instance._isDestroyed) return;

	// ⚡ BOLT OPTIMIZATION: Process attribute changes and build _pendingStateChanges
	// inside the primary validation loop to avoid allocating an intermediate `stateChanges`
	// object and iterating twice over the keys.
	// ⚡ BOLT OPTIMIZATION: Use for...in to avoid allocating an array with Object.keys()
	if (changes) {
		for (const key in changes) {
			if (!Object.prototype.hasOwnProperty.call(changes, key)) continue;
			const newValue = changes[key];
			if (instance._state[key] !== newValue) {
				instance._state[key] = newValue;

				if (!instance._pendingStateChanges) {
					instance._pendingStateChanges = instance._reusableStateChanges || {};
					instance._pendingAttributeChanges = instance._reusableAttributeChanges || {};
					// ⚡ BOLT OPTIMIZATION: Add to global dirty array instead of queuing separate rAF per component
					dirtyComponents.push(instance);
					if (!isRafQueued) {
						isRafQueued = true;
						mutate(flushGlobalStateChanges);
					}
				}

				// Build batched state change payload
				instance._pendingStateChanges[key] = newValue;

				if (typeof __GIA_NANO__ === "undefined" || !__GIA_NANO__) {
					// Process state changes for attributes
					const type = typeof newValue;
					if (type === "boolean" || type === "string") {
						let attrName = globalStateAttributeCache.get(key);
						if (!attrName) {
							// Convert camelCase to kebab-case
							const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
							attrName = `data-${kebabKey}`;
							globalStateAttributeCache.set(key, attrName);
						}

						instance._pendingAttributeChanges[attrName] =
							type === "boolean" ? (newValue ? "true" : "false") : newValue;
					}
				}
			}
		}
	}
}

/**
 * Flushes pending state changes to the DOM and calls instance.stateChange()
 * @param {object} instance - Component instance
 */
export function flushStateChanges(instance) {
	if (!instance.element) return;

	if (typeof __GIA_NANO__ === "undefined" || !__GIA_NANO__) {
		// Apply batched attribute changes
		// ⚡ BOLT OPTIMIZATION: Fast-failing for...in empty check to avoid Object.keys() array allocation
		// when no attributes changed (common in hot paths like games or parallax).
		let hasAttrChanges = false;
		for (const _k in instance._pendingAttributeChanges) {
			hasAttrChanges = true;
			break;
		}

		if (hasAttrChanges) {
			// ⚡ BOLT OPTIMIZATION: Use for...in to avoid allocating an array with Object.keys()
			for (const attrName in instance._pendingAttributeChanges) {
				if (!Object.prototype.hasOwnProperty.call(instance._pendingAttributeChanges, attrName)) continue;
				const value = instance._pendingAttributeChanges[attrName];
				if (instance.element.getAttribute(attrName) !== value) {
					instance.element.setAttribute(attrName, value);
				}
			}
		}
	}

	instance.stateChange(instance._pendingStateChanges);

	// ⚡ BOLT OPTIMIZATION: Clear and reuse objects to prevent GC allocation spikes
	instance._reusableStateChanges = instance._pendingStateChanges;
	instance._reusableAttributeChanges = instance._pendingAttributeChanges;

	for (const k in instance._reusableStateChanges) {
		delete instance._reusableStateChanges[k];
	}

	if (instance._reusableAttributeChanges) {
		for (const k in instance._reusableAttributeChanges) {
			delete instance._reusableAttributeChanges[k];
		}
	}

	instance._pendingStateChanges = null;
	instance._pendingAttributeChanges = null;
}

/**
 * Resets any pending state objects on unmount
 * @param {object} instance - Component instance
 */
export function cleanupComponentState(instance) {
	instance._pendingStateChanges = null;
	instance._pendingAttributeChanges = null;
}
