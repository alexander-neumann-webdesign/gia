// biome-ignore assist/source/organizeImports: custom sort
import "../src/registry";
import loadComponents from "../src/loadComponents";
import createInstance from "../src/createInstance";
import removeComponents from "../src/removeComponents";
import destroyInstance from "../src/removeComponents";
import getComponentFromElement from "../src/getComponentFromElement";
import Component from "../src/Component";
import BaseComponent from "../src/BaseComponent";
import eventbus from "../src/eventbus";
import config from "../src/config";
import { initObserver } from "../src/autoMount";

// Initialize the autoMount observer if configured initially (usually false)
if (typeof window !== "undefined") {
    setTimeout(initObserver, 0);
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
};
