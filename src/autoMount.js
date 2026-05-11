import config from "./config";
import loadComponents from "./loadComponents";
import destroyInstance from "./destroyInstance";
import { queryAll } from "./utils";

let observer = null;

function handleMutations(mutations) {
    const attrName = `${config.get("attrPrefix")}-component`;
    const componentsToLoad = typeof window !== "undefined" && window.gia ? window.gia.components : {};

    const addedElements = new Set();

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
                addedElements.add(node);
            }
        }
    }

    // If nodes were added, run loadComponents ONLY on the added nodes rather than the whole body
    // This turns an O(N) operation (N = total DOM nodes) into O(K) (K = added DOM nodes)
    // Set elements can be iterated via for...of (avoiding Array.from())
    for (const node of addedElements) {
        // ensure node is still in document
        if (node.isConnected) {
            loadComponents(componentsToLoad, node);
        }
    }
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
