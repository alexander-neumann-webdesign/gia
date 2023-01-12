(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["BaseComponent"] = factory();
	else
		root["BaseComponent"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 257:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
	value: true
}));

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _utils = __webpack_require__(610);

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Component without code splitting support
 */

var Component = function () {
	function Component(element, options) {
		_classCallCheck(this, Component);

		this.element = element;
		this.element["__gia_component__"] = this;
		this._ref = {};
		this._options = options || {};
		this._state = {};
	}

	_createClass(Component, [{
		key: "_load",
		value: function _load() {
			this.mount();
		}
	}, {
		key: "mount",
		value: function mount() {
			console.warn("Component " + this._name + " does not have \"mount\" method.");
		}
	}, {
		key: "unmount",
		value: function unmount() {
			// this is here only to be rewritten
		}
	}, {
		key: "getRef",
		value: function getRef(ref) {
			var prefixed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

			return "[data-ref=\"" + (prefixed ? this._name + ":" : "") + ref + "\"]";
		}
	}, {
		key: "setState",
		value: function setState(changes) {
			var _this = this;

			var stateChanges = {};

			Object.keys(changes).forEach(function (key) {
				if (Array.isArray(changes[key])) {
					if (_this._state[key] != null && Array.isArray(_this._state[key])) {
						if (_this._state[key].length === changes[key].length) {
							changes[key].some(function (item, index) {
								if (_this._state[key][index] !== item) {
									stateChanges[key] = changes[key];
									_this._state[key] = stateChanges[key];
									return true;
								}
								return false;
							});
						} else {
							stateChanges[key] = changes[key];
							_this._state[key] = stateChanges[key];
						}
					} else {
						stateChanges[key] = changes[key];
						_this._state[key] = stateChanges[key];
					}
				} else if (_typeof(changes[key]) === "object") {
					if (_this._state[key] != null && _typeof(_this._state[key]) === "object") {
						stateChanges[key] = {};
						Object.keys(changes[key]).forEach(function (subkey) {
							if (_this._state[key][subkey] !== changes[key][subkey]) {
								stateChanges[key][subkey] = changes[key][subkey];
							}
						});
					} else {
						stateChanges[key] = changes[key];
					}

					_this._state[key] = _extends({}, _this._state[key], stateChanges[key]);
				} else {
					if (_this._state[key] !== changes[key]) {
						stateChanges[key] = changes[key];

						_this._state[key] = changes[key];
					}
				}
			});

			Object.keys(stateChanges).forEach(function (key) {
				if (Array.isArray(changes[key])) {
					if (stateChanges[key].length === 0) {
						delete stateChanges[key];
					}
				} else if (_typeof(changes[key]) === "object") {
					if (Object.keys(stateChanges[key]).length === 0) {
						delete stateChanges[key];
					}
				}
			});

			this.stateChange(stateChanges);
		}
	}, {
		key: "stateChange",
		value: function stateChange(stateChanges) {
			// this is here only to be rewritten
		}
	}, {
		key: "ref",
		get: function get() {
			return this._ref;
		},
		set: function set(items) {
			var _this2 = this;

			var allRefs = (0, _utils.queryAll)("[data-ref]", this.element);

			if (Object.keys(items).length === 0) {
				allRefs.forEach(function (element) {
					var refName = element.getAttribute("data-ref");
					if (refName.indexOf(":") !== -1) {
						var refNameArray = refName.split(":");
						if (refNameArray[0] == _this2._name) {
							if (!_this2._ref[refNameArray[1]]) {
								_this2._ref[refNameArray[1]] = allRefs.filter(function (item) {
									return item.getAttribute("data-ref") === refName;
								});
							}
						} else {
							return;
						}
					} else {
						if (!_this2._ref[refName]) {
							_this2._ref[refName] = allRefs.filter(function (item) {
								return item.getAttribute("data-ref") === refName;
							});
						}
					}
				});
			} else {
				this._ref = Object.keys(items).map(function (key) {
					var isArray = Array.isArray(items[key]);

					// non-empty refs
					if (items[key] !== null && isArray && items[key].length > 0) {
						return {
							name: key,
							value: items[key]
						};
					}

					var name = key;
					var prefixedName = _this2._name + ":" + name;

					var refs = allRefs.filter(function (element) {
						return element.getAttribute("data-ref") === prefixedName;
					});

					if (refs.length === 0) {
						refs = allRefs.filter(function (element) {
							return element.getAttribute("data-ref") === name;
						});
					}

					if (!isArray) {
						refs = refs.length ? refs[0] : null;
					}

					return {
						name: key,
						value: refs
					};
				}).reduce(function (acc, ref) {
					acc[ref.name] = ref.value;
					return acc;
				}, {});
			}

			return this._ref;
		}
	}, {
		key: "options",
		get: function get() {
			return this._options;
		},
		set: function set(defaults) {
			var options = {};
			var optionsFromAttribute = this.element.getAttribute("g-options");
			if (optionsFromAttribute) {
				options = JSON.parse(optionsFromAttribute);
			}

			this._options = _extends({}, this._options, defaults, options);

			return this._options;
		}
	}, {
		key: "state",
		get: function get() {
			return this._state;
		},
		set: function set(state) {
			console.warn("You should not change state manually. Use setState instead.");
			this._state = state;
		}
	}]);

	return Component;
}();

exports["default"] = Component;

/***/ }),

/***/ 610:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
    value: true
}));
exports.query = query;
exports.queryAll = queryAll;
exports.toggleClass = toggleClass;
exports.removeClass = removeClass;
exports.addClass = addClass;
exports.triggerEvent = triggerEvent;
function query(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    if (typeof selector !== 'string') {
        return selector;
    }

    return context.querySelector(selector);
}

function queryAll(selector) {
    var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

    if (typeof selector !== 'string') {
        return selector;
    }

    return Array.prototype.slice.call(context.querySelectorAll(selector));
}

function toggleClass(element, className) {
    var condition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (condition === null) {
        if (element.classList.contains(className)) {
            element.classList.remove(className);
        } else {
            element.classList.add(className);
        }
    } else {
        if (condition) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }
}

function removeClass(nodes, className) {
    if (Array.isArray(nodes)) {
        nodes.forEach(function (node) {
            return node.classList.remove(className);
        });
    } else {
        nodes.classList.remove(className);
    }

    return nodes;
}

function addClass(nodes, className) {
    if (Array.isArray(nodes)) {
        nodes.forEach(function (node) {
            return node.classList.add(className);
        });
    } else {
        nodes.classList.add(className);
    }

    return nodes;
}

function triggerEvent(element, eventType) {
    var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
        bubbles: true,
        cancelable: true,
        detail: null
    };

    options.detail = params;
    var event = new CustomEvent(eventType, options);
    element.dispatchEvent(event);
}

/***/ }),

/***/ 372:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var _BaseComponent = __webpack_require__(257);

var _BaseComponent2 = _interopRequireDefault(_BaseComponent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = _BaseComponent2.default; // this is here for webpack to expose BaseComponent as window.BaseComponent

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(372);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});