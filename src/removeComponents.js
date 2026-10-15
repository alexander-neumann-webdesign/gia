import config from "./config.js";
import destroyInstance from "./destroyInstance.js";
import { queryAll } from "./utils.js";

/**
 * Removes instances of components on elements within the context
 * @param context: DOM element
 */

export default function removeComponents(context = document.documentElement) {
	// Defensive handling if called as removeComponents(components, context)
	if (
		context &&
		typeof context.querySelectorAll !== "function" &&
		arguments[1] &&
		typeof arguments[1].querySelectorAll === "function"
	) {
		context = arguments[1];
	}

	const attrName = `${config.get("attrPrefix")}-component`;
	const components = queryAll(`[${attrName}]`, context);


	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid NodeList iteration overhead
	for (let i = 0; i < components.length; i++) {
		destroyInstance(components[i]);
	}

	if (context && context.nodeType === 1 && context.hasAttribute(attrName)) {
		destroyInstance(context);
	}
}
