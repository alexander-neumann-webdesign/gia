import config from "./config.js";
import loadComponents from "./loadComponents.js";
import destroyInstance from "./destroyInstance.js";
import { queryAll } from "./utils.js";

let observer = null;
let _currentComponentsToLoad = null;

// ⚡ BOLT OPTIMIZATION: Extract Set to module scope to prevent GC churn in high-frequency callbacks
const addedElements = new Set();

const _processAddedNode = (node) => {
    if (node.isConnected) {
        loadComponents(_currentComponentsToLoad, node);
    }
};

function handleMutations(mutations) {
    const attrName = `${config.get("attrPrefix")}-component`;
    const componentsToLoad = typeof window !== "undefined" && window.gia ? window.gia.components : {};

    addedElements.clear();

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
        for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
                // ⚡ BOLT OPTIMIZATION: Only track nodes that are, or contain, components.
                // This prevents loadComponents from running redundantly when large blocks
                // of plain HTML (like list items or paragraphs) are inserted.
                if (node.hasAttribute(attrName) || node.querySelector(`[${attrName}]`)) {
                    addedElements.add(node);
                }
            }
        }
    }

    // If nodes were added, run loadComponents ONLY on the added nodes rather than the whole body
    // This turns an O(N) operation (N = total DOM nodes) into O(K) (K = added DOM nodes)
    // ⚡ BOLT OPTIMIZATION: Avoid for...of Iterator allocation by using Set.prototype.forEach with hoisted callback
    _currentComponentsToLoad = componentsToLoad;
    addedElements.forEach(_processAddedNode);
    _currentComponentsToLoad = null;

    // ⚡ BOLT OPTIMIZATION: Clear the Set after use to release strong references to added DOM nodes,
    // preventing memory leaks if those elements are subsequently detached.
    addedElements.clear();
}

export function initObserver() {
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
const originalConfigSet = config.set;
config.set = function (name, value) {
    originalConfigSet.call(this, name, value);
    if (name === "autoMountComponents") {
        initObserver();
    }
};

export default initObserver;
