(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["destroyInstance"] = factory();
	else
		root["destroyInstance"] = factory();
})(self, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 686:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
    value: true
}));

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Config for setting and changing global settings
 */

var Config = function () {
    function Config() {
        _classCallCheck(this, Config);

        this._options = {
            log: true
        };
    }

    _createClass(Config, [{
        key: "set",
        value: function set(name, value) {
            this._options[name] = value;
        }
    }, {
        key: "get",
        value: function get(name) {
            return this._options[name];
        }
    }]);

    return Config;
}();

exports["default"] = new Config();

/***/ }),

/***/ 497:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {



Object.defineProperty(exports, "__esModule", ({
    value: true
}));
exports["default"] = destroyInstance;

var _getComponentFromElement = __webpack_require__(199);

var _getComponentFromElement2 = _interopRequireDefault(_getComponentFromElement);

var _config = __webpack_require__(686);

var _config2 = _interopRequireDefault(_config);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Destroys and removes instance from DOM element
 * @param element: DOM element
 */

function destroyInstance(element) {
    var instance = (0, _getComponentFromElement2.default)(element);
    if (instance) {
        var name = instance._name;
        instance.unmount();
        element['__gia_component__'] = null;
        if (_config2.default.get('log')) {
            console.info('Removed component "' + name + '".');
        }
    }
}

/***/ }),

/***/ 199:
/***/ ((__unused_webpack_module, exports) => {



Object.defineProperty(exports, "__esModule", ({
    value: true
}));
exports["default"] = getComponentFromElement;
/**
 * Return instance from element
 * @param element: DOM element or ID of element
 * @returns component instance
 */

function getComponentFromElement(element) {
    if (typeof element === 'string') {
        element = document.getElementById(element);

        if (!element) {
            return null;
        }
    }

    return element['__gia_component__'];
}

/***/ }),

/***/ 762:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



var _destroyInstance = __webpack_require__(497);

var _destroyInstance2 = _interopRequireDefault(_destroyInstance);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = _destroyInstance2.default; // this is here for webpack to expose destroyInstance as window.destroyInstance

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
/******/ 	var __webpack_exports__ = __webpack_require__(762);
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});