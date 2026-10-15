export function register(ComponentClass, options = {}) {
	// Safety check
	if (typeof ComponentClass !== "function") {
		console.error("Gia: Register failed. Expected a Class, got:", ComponentClass);
		return;
	}

	// Extract name automatically (e.g., "ProductComparison")
	const name = ComponentClass.name;

	if (!name) {
		console.warn("Gia: Cannot register an anonymous class. Please use a named class.");
		return;
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

