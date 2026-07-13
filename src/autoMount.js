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
        // ⚡ BOLT OPTIMIZATION: Instead of querying every single added node, 
        // we just queue the mutation target (parent). This replaces an O(N) query loop
        // with a single O(1) querySelectorAll on the parent.
        if (mutation.addedNodes.length > 0 && mutation.target.nodeType === Node.ELEMENT_NODE) {
            if (_addedElements.indexOf(mutation.target) === -1) {
                _addedElements.push(mutation.target);
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
