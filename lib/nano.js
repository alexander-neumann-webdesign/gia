// biome-ignore assist/source/organizeImports: custom sort
import { register } from "../src/registry";
import loadComponents from "../src/loadComponents";
import createInstance from "../src/createInstance";
import removeComponents from "../src/removeComponents";
import destroyInstance from "../src/destroyInstance";
import getComponentFromElement from "../src/getComponentFromElement";
import BaseComponent from "../src/BaseComponent";
import config from "../src/config";
import * as utils from "../src/utils";
import { measure, mutate, clear } from "../src/scheduler";
import { requestedAutoMount } from "../src/autoMountScript";

if (typeof window !== "undefined") {
	if (requestedAutoMount("nano")) {
		loadComponents();
	}
}

export {
	loadComponents,
	createInstance,
	removeComponents,
	destroyInstance,
	BaseComponent,
	getComponentFromElement,
	register,
	config,
	utils,
	measure,
	mutate,
	clear,
};

