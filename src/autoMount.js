import config from "./config.js";
import loadComponents from "./loadComponents.js";
import destroyInstance from "./destroyInstance.js";
import { queryAll } from "./utils.js";

let observer = null;
let _currentComponentsToLoad = null;
const _addedElements = [];

const _processAddedNode = (node) => {
    if (node.isConnected) {
        loadComponents(_currentComponentsToLoad, node);
    }
};

function handleMutations(mutations) {
    const attrName = `${config.get("attrPrefix")}-component`;
    const componentsToLoad = typeof window !== "undefined" && window.gia ? window.gia.components : {};

    // ⚡ BOLT OPTIMIZATION: Prevent garbage collection churn by clearing and reusing the module-scoped _addedElements array
    _addedElements.length = 0;

    // ⚡ BOLT OPTIMIZATION: Use standard for loops to avoid Array/NodeList iteration overhead
    for (let m = 0; m < mutations.length; m++) {
        const mutation = mutations[m];

        // Handle removed nodes
        for (let i = 0; i < mutation.removedNodes.length; i++) {
            const node = mutation.removedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.hasAttribute(attrName)) {
                    destroyInstance(node);
                }
                const nestedComponents = queryAll(`[${attrName}]`, node);
                for (let j = 0; j < nestedComponents.length; j++) {
                    destroyInstance(nestedComponents[j]);
                }
            }
        }

        // Track added nodes
        // We queue the actual added elements rather than their parent.
        // This prevents scanning the entire document when a single node is added to <body>,
        // and correctly ignores text node mutations.
        if (mutation.addedNodes.length > 0) {
            for (let j = 0; j < mutation.addedNodes.length; j++) {
                const node = mutation.addedNodes[j];
                if (node.nodeType === Node.ELEMENT_NODE) {
                    // ⚡ BOLT OPTIMIZATION: Check if node is or contains a component
                    // to completely bypass loadComponents overhead for plain HTML insertions
                    if (node.hasAttribute(attrName) || node.querySelector(`[${attrName}]`)) {
                        if (_addedElements.indexOf(node) === -1) {
                            _addedElements.push(node);
                        }
                    }
                }
            }
        }
    }

    // If nodes were added, run loadComponents ONLY on the added nodes rather than the whole body
    // This turns an O(N) operation (N = total DOM nodes) into O(K) (K = added DOM nodes)
    // ⚡ BOLT OPTIMIZATION: Avoid Array Iterator allocation by using standard for loop
    _currentComponentsToLoad = componentsToLoad;
    for (let i = 0; i < _addedElements.length; i++) {
        _processAddedNode(_addedElements[i]);
    }
    _currentComponentsToLoad = null;
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
