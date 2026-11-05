// camelCase key -> kebab-case, e.g. "autoPlay" -> "auto-play"
const cache = new Map();

/**
 * Converts an option or state key to its kebab-case attribute suffix, cached: keys come from a
 * component's option defaults and state, a small set that repeats for every instance.
 * @param {string} key
 * @returns {string}
 */
export function kebab(key) {
	let name = cache.get(key);
	if (name === undefined) {
		name = key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
		cache.set(key, name);
	}
	return name;
}
