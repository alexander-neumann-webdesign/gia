import type {
	GiaConfig,
	ConfigManager,
	ScheduledTask,
	ScrollData,
	WindowDimensions,
	ComponentConstructor,
	ComponentLoader,
} from "./index";

export type {
	GiaConfig,
	ConfigManager,
	ScheduledTask,
	ScrollData,
	WindowDimensions,
	ComponentConstructor,
	ComponentLoader,
};

export {
	config,
	measure,
	mutate,
	clear,
	utils,
	BaseComponent,
	loadComponents,
	createInstance,
	removeComponents,
	destroyInstance,
	getComponentFromElement,
	register,
} from "./index";

