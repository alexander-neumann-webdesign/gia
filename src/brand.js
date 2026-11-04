/**
 * Marks Gia component classes so they can be recognised safely.
 *
 * Symbol.for() returns the same symbol in every bundle, build tier, and version on the page,
 * unlike internal property names, which are mangled differently per build. That makes it a
 * reliable cross-bundle check, and it cannot be faked by markup or by unrelated libraries that
 * happen to expose a `mount()` method.
 */
export const GIA_COMPONENT = Symbol.for("gia.component");

/**
 * True when `ctor` is a class derived from any Gia BaseComponent.
 * @param {*} ctor
 * @returns {boolean}
 */
export function isComponentClass(ctor) {
	return typeof ctor === "function" && !!ctor.prototype && ctor.prototype[GIA_COMPONENT] === true;
}
