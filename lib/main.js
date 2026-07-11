// biome-ignore assist/source/organizeImports: custom sort
import "../src/registry";
import loadComponents from "../src/loadComponents";
import createInstance from "../src/createInstance";
import removeComponents from "../src/removeComponents";
import destroyInstance from "../src/destroyInstance";
import getComponentFromElement from "../src/getComponentFromElement";
import Component from "../src/Component";
import BaseComponent from "../src/BaseComponent";
import eventbus from "../src/eventbus";
import config from "../src/config";
import { initObserver } from "../src/autoMount";
import * as utils from "../src/utils";
import { measure, mutate, clear } from "../src/scheduler";

// Initialize the autoMount observer if configured initially (usually false)
if (typeof window !== "undefined") {
    if (typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) {
        setTimeout(initObserver, 0);
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
	eventbus,
	config,
	utils,
	measure,
	mutate,
	clear,
};
