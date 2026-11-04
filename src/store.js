/**
 * Global store for component instances to prevent memory leaks.
 * WeakMap guarantees that if the DOM element is removed, the component instance
 * is garbage collected.
 *
 * Attached to globalThis.__gia_store__ (the window in browsers) to guarantee cross-bundle and
 * cross-version idempotency across multiple instances or micro-frontends.
 */
export const components = globalThis.__gia_store__ || (globalThis.__gia_store__ = new WeakMap());
