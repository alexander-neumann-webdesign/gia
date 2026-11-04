export function register(ComponentClass, options = {}) {
	// Safety check
	if (typeof ComponentClass !== "function") {
		console.error("Gia: Register failed. Expected a Class, got:", ComponentClass);
		return;
	}

	// Explicit name, or the class name (e.g., "ProductComparison"). Minifiers rename classes in
	// production builds, so pass { name } when the build does not keep class names.
	const name = options.name || ComponentClass.name;

	if (!name) {
		console.warn("Gia: Cannot register an anonymous class. Pass { name } or use a named class.");
		return;
	}

	if (!options.name && name.length <= 2) {
		// console.error (not warn): dist builds strip console.warn, and this registration will
		// almost certainly not match any data-component="..." in the markup
		console.error(`Gia: class name "${name}" looks minified; use register(Class, { name: "..." })`);
	}

	if (options.priority !== undefined) {
		ComponentClass._gia_priority = options.priority;
	}

	// Add to the global registry
	if (typeof window !== "undefined") {
		window.gia = window.gia || {};
		window.gia.components = window.gia.components || {};
		window.gia.components[name] = ComponentClass;
	}
}

export function initRegistry() {
	if (typeof window !== "undefined") {
		window.gia = window.gia || {};
		window.gia.components = window.gia.components || {};
		window.gia.register = register;
	}
}

initRegistry();

