/**
 * Global store for component instances to prevent memory leaks.
 * WeakMap guarantees that if the DOM element is removed, the component instance
 * is garbage collected.
 *
 * Attaches to window.__gia_store__ to guarantee cross-bundle and cross-version
 * idempotency across multiple instances or micro-frontends.
 */
const store =
	(typeof globalThis !== "undefined" && globalThis.__gia_store__) ||
	(typeof window !== "undefined" && window.__gia_store__) ||
	new WeakMap();

if (typeof globalThis !== "undefined" && !globalThis.__gia_store__) {
	globalThis.__gia_store__ = store;
}
if (typeof window !== "undefined" && !window.__gia_store__) {
	window.__gia_store__ = store;
}

export const components = store;


