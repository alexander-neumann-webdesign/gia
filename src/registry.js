if (typeof window !== "undefined") {
	window.gia = window.gia || {};
	window.gia.components = window.gia.components || {};

	/**
	 * Registers a component class to the framework.
	 * Usage: gia.register(ProductComparison);
	 */
	window.gia.register = (ComponentClass) => {
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

		// Add to the global registry
		window.gia.components[name] = ComponentClass;
	};
}
