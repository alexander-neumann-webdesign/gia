import config from "./config";
import loadComponents from "./loadComponents";
import destroyInstance from "./destroyInstance";
import { queryAll } from "./utils";

let observer = null;

function handleMutations(mutations) {
    const attrName = `${config.get("attrPrefix")}-component`;
    const componentsToLoad = typeof window !== "undefined" && window.gia ? window.gia.components : {};

    const addedElements = new Set();

    mutations.forEach((mutation) => {
        // Handle removed nodes
        mutation.removedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.hasAttribute(attrName)) {
                    destroyInstance(node);
                }
                const nestedComponents = queryAll(`[${attrName}]`, node);
                nestedComponents.forEach((childNode) => destroyInstance(childNode));
            }
        });

        // Track added nodes
        mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                addedElements.add(node);
            }
        });
    });

    // If nodes were added, run loadComponents ONLY on the added nodes rather than the whole body
    // This turns an O(N) operation (N = total DOM nodes) into O(K) (K = added DOM nodes)
    addedElements.forEach((node) => {
        // ensure node is still in document
        if (node.isConnected) {
            loadComponents(componentsToLoad, node);
        }
    });
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
