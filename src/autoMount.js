import config from "./config.js";
import loadComponents from "./loadComponents.js";
import destroyInstance from "./destroyInstance.js";
import { queryAll } from "./utils.js";

let observer = null;
let _currentComponentsToLoad = null;
let _currentAttrName = null;
const _addedElements = [];
// element -> its component attribute value before this batch (first attribute record wins)
// ⚡ BOLT OPTIMIZATION: module-scoped and cleared per batch to avoid allocating a Map per callback
const _attrChanges = new Map();

const _processAddedNode = (node) => {
    if (node.isConnected) {
        loadComponents(_currentComponentsToLoad, node);
    }
};

// The component attribute of an element already in the DOM was added, removed or changed
function _processAttributeChange(oldValue, el) {
    if (!el.isConnected) return; // removed in this batch: handled as a removed node
    const value = el.getAttribute(_currentAttrName);
    if (value === oldValue) return; // changed and changed back within the batch
    if (oldValue !== null) {
        destroyInstance(el); // no longer this component (also cancels a deferred mount)
    }
    if (value !== null) {
        loadComponents(_currentComponentsToLoad, el);
    }
}

function handleMutations(mutations) {
    const attrName = `${config.get("attrPrefix")}-component`;
    const componentsToLoad = typeof window !== "undefined" && window.gia ? window.gia.components : {};

    // ⚡ BOLT OPTIMIZATION: Prevent garbage collection churn by clearing and reusing the module-scoped _addedElements array
    _addedElements.length = 0;
    _attrChanges.clear();

    // ⚡ BOLT OPTIMIZATION: Use standard for loops to avoid Array/NodeList iteration overhead
    for (let m = 0; m < mutations.length; m++) {
        const mutation = mutations[m];

        if (mutation.type === "attributes") {
            if (!_attrChanges.has(mutation.target)) {
                _attrChanges.set(mutation.target, mutation.oldValue);
            }
            continue;
        }

        // Handle removed nodes
        for (let i = 0; i < mutation.removedNodes.length; i++) {
            const node = mutation.removedNodes[i];
            // A node that is connected again by the time this callback runs was moved (e.g. a
            // list re-sorted with appendChild), not removed: keep its components and their state.
            // Its addedNodes record finds them already mounted and leaves them alone.
            if (node.nodeType === Node.ELEMENT_NODE && !node.isConnected) {
                // ⚡ BOLT OPTIMIZATION: Destroy nested child components first in reverse DOM order (bottom-up teardown)
                const nestedComponents = queryAll(`[${attrName}]`, node);
                for (let j = nestedComponents.length - 1; j >= 0; j--) {
                    destroyInstance(nestedComponents[j]);
                }
                // Unconditional: the attribute may have been removed in the same batch
                destroyInstance(node);
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
                    // ⚡ BOLT OPTIMIZATION: Aggressively filter nodes synchronously to avoid querySelectorAll overhead for plain HTML
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
    _currentAttrName = attrName;
    if (_attrChanges.size > 0) {
        _attrChanges.forEach(_processAttributeChange);
        _attrChanges.clear(); // release the element references
    }
    for (let i = 0; i < _addedElements.length; i++) {
        _processAddedNode(_addedElements[i]);
    }
    _currentComponentsToLoad = null;
    _currentAttrName = null;
}

export function initObserver() {
    if (typeof __GIA_MINI__ !== "undefined" && __GIA_MINI__) return;
    if (typeof document === "undefined") return;

    if (config.get("autoMountComponents") && !observer) {
        const root = document.documentElement || document.body;
        if (!root) return;
        const ObserverClass =
            (typeof window !== "undefined" && window.MutationObserver) ||
            (typeof MutationObserver !== "undefined" ? MutationObserver : null);
        if (!ObserverClass) return;
        observer = new ObserverClass(handleMutations);
        observer.observe(root, {
            childList: true,
            subtree: true,
            // Only the component attribute, so other attribute changes cost nothing
            attributes: true,
            attributeOldValue: true,
            attributeFilter: [`${config.get("attrPrefix")}-component`],
        });
    } else if (!config.get("autoMountComponents") && observer) {
        observer.disconnect();
        observer = null;
    }
}

// Intercept config.set to dynamically start/stop observer when setting 'autoMountComponents'
if ((typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) && !config._hasAutoMountHook) {
    config._hasAutoMountHook = true;
    const originalConfigSet = config.set;
    config.set = function (name, value) {
        originalConfigSet.call(this, name, value);
        if (name === "autoMountComponents") {
            initObserver();
        } else if (name === "attrPrefix" && observer) {
            // Re-observe so the attribute filter follows the new prefix
            observer.disconnect();
            observer = null;
            initObserver();
        }
    };
}

export default initObserver;
