import config from "./config";
import loadComponents from "./loadComponents";
import destroyInstance from "./destroyInstance";
import { queryAll } from "./utils";

let observer = null;

function handleMutations(mutations) {
    const attrName = `${config.get("attrPrefix")}-component`;
    const componentsToLoad = typeof window !== "undefined" && window.gia ? window.gia.components : {};

    let hasAddedNodes = false;

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

        // Track if there are added nodes
        if (mutation.addedNodes.length > 0) {
            hasAddedNodes = true;
        }
    });

    // If nodes were added, run loadComponents on the body so any new components are initialized
    // We pass the global registry to ensure dynamically loaded templates get initialized correctly
    if (hasAddedNodes) {
        // Just call loadComponents and it will find all uninitialized data-components
        loadComponents(componentsToLoad, document.body);
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
