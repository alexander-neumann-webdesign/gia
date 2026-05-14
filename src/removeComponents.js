import config from "./config.js";
import destroyInstance from "./destroyInstance.js";
import { queryAll } from "./utils.js";

/**
 * Removes instances of components on elements within the context
 * @param context: DOM element
 */

export default function removeComponents(context = document.documentElement) {
	const components = queryAll(`[${config.get("attrPrefix")}-component]`, context);

	// ⚡ BOLT OPTIMIZATION: Use standard for loop to avoid NodeList iteration overhead
	for (let i = 0; i < components.length; i++) {
		destroyInstance(components[i]);
	}
}
