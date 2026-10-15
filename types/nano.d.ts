import type {
	GiaConfig,
	ConfigManager,
	ScheduledTask,
	ScrollData,
	WindowDimensions,
	ComponentConstructor,
} from "./index";

export type {
	GiaConfig,
	ConfigManager,
	ScheduledTask,
	ScrollData,
	WindowDimensions,
	ComponentConstructor,
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

