import config from "./config";
import destroyInstance from "./destroyInstance";
import { queryAll } from "./utils";

/**
 * Removes instances of components on elements within the context
 * @param context: DOM element
 */

export default function removeComponents(context = document.documentElement) {
	queryAll(`[${config.get("attrPrefix")}-component]`, context).forEach(
		(element) => {
			destroyInstance(element);
		},
	);
}
