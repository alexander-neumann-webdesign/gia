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

if (typeof window !== "undefined") {
	const currentScript =
		typeof document !== "undefined" &&
		(document.currentScript ||
			document.querySelector("script[src*='gia'][data-auto-mount], script[data-auto-mount]"));
	if (currentScript && currentScript.hasAttribute("data-auto-mount")) {
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
