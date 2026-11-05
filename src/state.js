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

// Attributes Gia reads itself. Mirroring state onto them would turn the element into another
// component, rebind actions or change refs/options, so those state keys are never mirrored.
const RESERVED_ATTR = /^data-(component|ref|options|action|mount)$/;

// camelCase state key -> data-kebab-case attribute name, or null when reserved (cached)
function _attrName(key) {
	let attrName = globalStateAttributeCache.get(key);
	if (attrName === undefined) {
		attrName = `data-${key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;
		if (RESERVED_ATTR.test(attrName)) {
			console.warn(`Gia: state "${key}" is not mirrored to ${attrName}, which Gia reserves.`);
			attrName = null;
		}
		globalStateAttributeCache.set(key, attrName);
	}
	return attrName;
}

// Value types that setState mirrors to a data-* attribute
function _isMirrored(value) {
	const type = typeof value;
	return type === "boolean" || type === "string" || type === "number";
}

// ⚡ BOLT OPTIMIZATION: Add to global dirty array instead of queuing separate rAF per component
function _markDirty(instance) {
	dirtyComponents.push(instance);
	if (!isRafQueued) {
		isRafQueued = true;
		mutate(flushGlobalStateChanges);
	}
}

/**
 * Starts a batch for `instance`, reporting `payload` to stateChange() when it is flushed.
 * ⚡ Fresh objects per batch: emptying and reusing them with `delete` costs far more than the
 * allocation it saves (deleting properties switches V8 objects to slow dictionary mode).
 */
function _startBatch(instance, payload) {
	instance._pendingStateChanges = payload;
	instance._pendingAttributeChanges = {}; // "data-*" keys: no clash with Object.prototype
	// Value each key had when this batch started (null prototype: any key name is safe)
	instance._stateOrigins = Object.create(null);
	_markDirty(instance);
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
			// A fresh payload per batch: stateChange() receives it and may keep it
			_startBatch(instance, {});
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
			// Primitive state values are mirrored to data-* attributes (reserved names: state only)
			const attrName = _attrName(key);
			if (attrName !== null) {
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
	instance._pendingStateChanges = null;
	instance._pendingAttributeChanges = null;
	instance._stateOrigins = null;

	let hasChanges = false;
	for (const _k in pending) {
		hasChanges = true;
		break;
	}
	// Every change in the batch was reverted: do not call stateChange() with an empty payload
	if (!hasChanges) return;

	if (!instance._isMounted) {
		// mount() has not run yet (setState() in the constructor while require() is pending):
		// the attributes are synced, but stateChange() waits for mount (see releaseHeldStateChanges)
		instance._heldStateChanges = instance._heldStateChanges
			? Object.assign(instance._heldStateChanges, pending)
			: pending;
		return;
	}
	instance.stateChange(pending);
}

/**
 * Called right after mount(): changes flushed while the instance was not mounted yet are reported
 * to stateChange() in the next frame, together with (and overridden by) any batch pending by then.
 * @param {object} instance - Component instance
 */
export function releaseHeldStateChanges(instance) {
	const held = instance._heldStateChanges;
	if (!held) return;
	instance._heldStateChanges = null;
	if (instance._pendingStateChanges) {
		instance._pendingStateChanges = Object.assign(held, instance._pendingStateChanges);
	} else {
		_startBatch(instance, held);
	}
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
	instance._heldStateChanges = null;
}
