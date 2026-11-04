import { mutate } from "./scheduler.js";

/**
 * Batched state updates and attribute syncing.
 *
 * setState() applies changes to instance._state synchronously and collects them per component
 * until the next mutate frame, where data-* attributes are synced and stateChange() is called
 * once with every key that changed during the batch.
 */

let isRafQueued = false;
const dirtyComponents = [];
const globalStateAttributeCache = new Map();

function flushGlobalStateChanges() {
	isRafQueued = false;
	// Only flush components that were dirty when this frame started. setState() called from a
	// stateChange() starts a new batch, flushed in the next frame (a stateChange that always sets
	// state then runs once per frame instead of looping forever inside this one).
	const count = dirtyComponents.length;
	// ⚡ BOLT OPTIMIZATION: Process all dirty components in a single mutate block
	// ⚡ BOLT OPTIMIZATION: Use classic for loop over Array instead of Set.forEach to prevent iterator allocation
	for (let i = 0; i < count; i++) {
		const comp = dirtyComponents[i];
		if (comp) {
			comp._flushStateChanges();
		}
	}
	if (dirtyComponents.length === count) {
		dirtyComponents.length = 0;
	} else {
		dirtyComponents.splice(0, count);
	}
}

// camelCase state key -> data-kebab-case attribute name (cached)
function _attrName(key) {
	let attrName = globalStateAttributeCache.get(key);
	if (!attrName) {
		attrName = `data-${key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
		globalStateAttributeCache.set(key, attrName);
	}
	return attrName;
}

// Value types that setState mirrors to a data-* attribute
function _isMirrored(value) {
	const type = typeof value;
	return type === "boolean" || type === "string" || type === "number";
}

// ⚡ BOLT OPTIMIZATION: Clear and reuse objects to prevent GC allocation spikes
function _clear(obj) {
	for (const k in obj) delete obj[k];
	return obj;
}

/**
 * Batches state changes and queues a render task via the scheduler.
 * @param {object} instance - Component instance
 * @param {object|Function} changes - Key/value state updates or updater function (prevState) => updates
 */
export function enqueueSetState(instance, changes) {
	if (!instance.element || instance._isDestroyed) return;

	if (typeof changes === "function") {
		changes = changes(instance._state);
	}
	if (!changes) return;

	// ⚡ BOLT OPTIMIZATION: Build _pendingStateChanges and attribute changes inside the primary
	// loop, without an intermediate object or Object.keys() array.
	for (const key in changes) {
		if (!Object.prototype.hasOwnProperty.call(changes, key)) continue;
		const newValue = changes[key];
		const prevValue = instance._state[key];
		if (prevValue === newValue) continue;
		instance._state[key] = newValue;

		if (!instance._pendingStateChanges) {
			instance._pendingStateChanges = instance._reusableStateChanges || {};
			instance._pendingAttributeChanges = instance._reusableAttributeChanges || {};
			// Value each key had when this batch started (null prototype: any key name is safe)
			instance._stateOrigins = instance._reusableStateOrigins || Object.create(null);
			// ⚡ BOLT OPTIMIZATION: Add to global dirty array instead of queuing separate rAF per component
			dirtyComponents.push(instance);
			if (!isRafQueued) {
				isRafQueued = true;
				mutate(flushGlobalStateChanges);
			}
		}

		const origins = instance._stateOrigins;
		if (!(key in origins)) {
			origins[key] = prevValue;
		} else if (origins[key] === newValue) {
			// Changed and changed back within the same batch (A -> B -> A): nothing to report
			delete instance._pendingStateChanges[key];
			if (typeof __GIA_NANO__ === "undefined" || !__GIA_NANO__) {
				delete instance._pendingAttributeChanges[_attrName(key)];
			}
			continue;
		}

		// Build batched state change payload
		instance._pendingStateChanges[key] = newValue;

		if (typeof __GIA_NANO__ === "undefined" || !__GIA_NANO__) {
			// Primitive state values are mirrored to data-* attributes
			const attrName = _attrName(key);
			if (_isMirrored(newValue)) {
				instance._pendingAttributeChanges[attrName] = String(newValue);
			} else if (_isMirrored(prevValue)) {
				// No longer a primitive (null, undefined, object...): the attribute mirrored the
				// previous value, so remove it instead of leaving a stale one (null = remove)
				instance._pendingAttributeChanges[attrName] = null;
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
	const pending = instance._pendingStateChanges;
	const attrs = instance._pendingAttributeChanges;
	if (!pending) return;

	if (typeof __GIA_NANO__ === "undefined" || !__GIA_NANO__) {
		// ⚡ BOLT OPTIMIZATION: for...in, no Object.keys() allocation; nothing runs when empty
		const el = instance.element;
		for (const attrName in attrs) {
			const value = attrs[attrName];
			if (value === null) {
				el.removeAttribute(attrName);
			} else if (el.getAttribute(attrName) !== value) {
				el.setAttribute(attrName, value);
			}
		}
	}

	// Release the batch before calling user code, so setState() inside stateChange() starts a new one
	instance._reusableStateChanges = null;
	instance._reusableAttributeChanges = _clear(attrs);
	instance._reusableStateOrigins = _clear(instance._stateOrigins);
	instance._pendingStateChanges = null;
	instance._pendingAttributeChanges = null;
	instance._stateOrigins = null;

	let hasChanges = false;
	for (const _k in pending) {
		hasChanges = true;
		break;
	}
	// Every change in the batch was reverted: do not call stateChange() with an empty payload
	if (hasChanges) {
		instance.stateChange(pending);
	}

	// Reuse the payload object for the next batch unless a new batch already started
	instance._reusableStateChanges = _clear(pending);
}

/**
 * Resets any pending state objects on unmount
 * @param {object} instance - Component instance
 */
export function cleanupComponentState(instance) {
	const idx = dirtyComponents.indexOf(instance);
	if (idx !== -1) {
		dirtyComponents[idx] = null;
	}
	instance._pendingStateChanges = null;
	instance._pendingAttributeChanges = null;
	instance._stateOrigins = null;
}
