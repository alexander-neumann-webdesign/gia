import { register } from "../src/registry";
import loadComponents from "../src/loadComponents";
import createInstance from "../src/createInstance";
import removeComponents from "../src/removeComponents";
import destroyInstance from "../src/destroyInstance";
import getComponentFromElement from "../src/getComponentFromElement";
import Component from "../src/Component";
import BaseComponent from "../src/BaseComponent";
import eventbus from "../src/eventbus";
import config from "../src/config";
import * as utils from "../src/utils";
import { measure, mutate, clear } from "../src/scheduler";
import { requestedAutoMount } from "../src/autoMountScript";

if (typeof window !== "undefined") {
	if (requestedAutoMount("mini")) {
		loadComponents();
	}
}

export {
	loadComponents,
	createInstance,
	removeComponents,
	destroyInstance,
	Component,
	BaseComponent,
	getComponentFromElement,
	register,
	eventbus,
	config,
	utils,
	measure,
	mutate,
	clear,
};
