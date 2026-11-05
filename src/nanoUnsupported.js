// Names already warned about: each unsupported API warns once per page load
const warned = new Set();

/**
 * Warns (once per API) that `name` does nothing in the nano build. Only referenced from
 * __GIA_NANO__ branches, so the other builds drop it.
 * @param {string} name - e.g. "observeScroll"
 */
export function nanoUnsupported(name) {
	if (warned.has(name)) return;
	warned.add(name);
	console.warn(`Gia: ${name}() is not available in the nano build and does nothing; use gia/mini or gia.`);
}
