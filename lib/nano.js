// biome-ignore assist/source/organizeImports: custom sort
import "../src/registry";
import loadComponents from "../src/loadComponents";
import createInstance from "../src/createInstance";
import removeComponents from "../src/removeComponents";
import destroyInstance from "../src/destroyInstance";
import getComponentFromElement from "../src/getComponentFromElement";
import BaseComponent from "../src/BaseComponent";
import config from "../src/config";
import * as utils from "../src/utils";

export {
	loadComponents,
	createInstance,
	removeComponents,
	destroyInstance,
	BaseComponent,
	getComponentFromElement,
	config,
	utils,
};
