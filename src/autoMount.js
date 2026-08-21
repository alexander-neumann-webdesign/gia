import config from "./config.js";
import loadComponents from "./loadComponents.js";
import destroyInstance from "./destroyInstance.js";
import { queryAll } from "./utils.js";

let observer = null;
let _currentComponentsToLoad = null;
const _addedElements = [];
const _removedElements = [];
let _isRafQueued = false;

const _processAddedNode = (node) => {
    if (node.isConnected) {
        loadComponents(_currentComponentsToLoad, node);
    }
};

const _flushMutations = () => {
    _isRafQueued = false;
    const attrName = `${config.get("attrPrefix")}-component`;

    // Process removed nodes
    for (let i = 0; i < _removedElements.length; i++) {
        const node = _removedElements[i];
        if (!node.isConnected) {
            if (node.hasAttribute(attrName)) {
                destroyInstance(node);
            }
            const nestedComponents = queryAll(`[${attrName}]`, node);
            for (let j = 0; j < nestedComponents.length; j++) {
                destroyInstance(nestedComponents[j]);
            }
        }
    }
    _removedElements.length = 0;

    // Process added nodes
    _currentComponentsToLoad = typeof window !== "undefined" && window.gia ? window.gia.components : {};
    for (let i = 0; i < _addedElements.length; i++) {
        _processAddedNode(_addedElements[i]);
    }
    _addedElements.length = 0;
    _currentComponentsToLoad = null;
};

function handleMutations(mutations) {
    // ⚡ BOLT OPTIMIZATION: Keep observer callbacks ultra-lightweight and defer deep traversals
    // to batched, asynchronous steps to prevent layout thrashing during DOM insertions.
    for (let m = 0; m < mutations.length; m++) {
        const mutation = mutations[m];

        // Track removed nodes
        for (let i = 0; i < mutation.removedNodes.length; i++) {
            const node = mutation.removedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (_removedElements.indexOf(node) === -1) {
                    _removedElements.push(node);
                }
            }
        }

        // Track added nodes
        if (mutation.addedNodes.length > 0) {
            for (let j = 0; j < mutation.addedNodes.length; j++) {
                const node = mutation.addedNodes[j];
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (_addedElements.indexOf(node) === -1) {
                        _addedElements.push(node);
                    }
                }
            }
        }
    }

    if (!_isRafQueued && (_addedElements.length > 0 || _removedElements.length > 0)) {
        _isRafQueued = true;
        if (typeof window !== "undefined" && window.requestAnimationFrame) {
            window.requestAnimationFrame(_flushMutations);
        } else {
            _flushMutations();
        }
    }
}

export function initObserver() {
    if (typeof __GIA_MINI__ !== "undefined" && __GIA_MINI__) return;
    if (typeof document === "undefined") return;

    if (config.get("autoMountComponents") && !observer) {
        observer = new MutationObserver(handleMutations);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    } else if (!config.get("autoMountComponents") && observer) {
        observer.disconnect();
        observer = null;
    }
}

// Intercept config.set to dynamically start/stop observer when setting 'autoMountComponents'
if (typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) {
    const originalConfigSet = config.set;
    config.set = function (name, value) {
        originalConfigSet.call(this, name, value);
        if (name === "autoMountComponents") {
            initObserver();
        }
    };
}

export default initObserver;
