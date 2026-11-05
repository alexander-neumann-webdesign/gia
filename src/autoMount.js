import config from "./config.js";
import { loadComponentsIn } from "./loadComponents.js";
import destroyInstance from "./destroyInstance.js";
import { queryAll } from "./utils.js";

/**
 * Auto-mount state shared by every Gia bundle on the page (globalThis, like the store and the
 * config), so two full bundles run one MutationObserver and hook config.set once instead of
 * doing the same work twice. "__gia_automount__" is reserved from mangling; property names
 * without a leading underscore are never mangled.
 */
const shared = globalThis.__gia_automount__ || (globalThis.__gia_automount__ = { observer: null, hooked: false });

// Roots to mount for the current batch, in order; the Set keeps them unique.
// ⚡ BOLT OPTIMIZATION: module-scoped and cleared per batch, no per-callback allocation
const _roots = [];
const _rootSet = new Set();
// element -> its component attribute value before this batch (first attribute record wins)
const _attrChanges = new Map();
let _currentAttrName = null;

function _queueRoot(el) {
    if (!_rootSet.has(el)) {
        _rootSet.add(el);
        _roots.push(el);
    }
}

// The component attribute of an element already in the DOM was added, removed or changed
function _processAttributeChange(oldValue, el) {
    if (!el.isConnected) return; // removed in this batch: handled as a removed node
    const value = el.getAttribute(_currentAttrName);
    if (value === oldValue) return; // changed and changed back within the batch
    if (oldValue !== null) {
        destroyInstance(el); // no longer this component (also cancels a deferred mount)
    }
    if (value !== null) {
        _queueRoot(el);
    }
}

function handleMutations(mutations) {
    const attrName = `${config.get("attrPrefix")}-component`;

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
                // ⚡ BOLT OPTIMIZATION: Destroy nested child components first in reverse DOM order
                // (bottom-up teardown). Leaf elements, the bulk of most removals, skip the query.
                if (node.firstElementChild !== null) {
                    const nestedComponents = queryAll(`[${attrName}]`, node);
                    for (let j = nestedComponents.length - 1; j >= 0; j--) {
                        destroyInstance(nestedComponents[j]);
                    }
                }
                // Unconditional: the attribute may have been removed in the same batch
                destroyInstance(node);
            }
        }

        // Queue the added elements themselves rather than their parent, so adding one node to
        // <body> never rescans the document; text nodes are ignored.
        for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            // ⚡ BOLT OPTIMIZATION: Filter synchronously to skip plain HTML without querySelectorAll
            if (
                node.nodeType === Node.ELEMENT_NODE &&
                (node.hasAttribute(attrName) || node.querySelector(`[${attrName}]`))
            ) {
                _queueRoot(node);
            }
        }
    }

    if (_attrChanges.size > 0) {
        _currentAttrName = attrName;
        _attrChanges.forEach(_processAttributeChange);
        _attrChanges.clear(); // release the element references
        _currentAttrName = null;
    }

    if (_roots.length > 0) {
        // Drop roots that were added and removed again within the batch
        let keep = 0;
        for (let i = 0; i < _roots.length; i++) {
            if (_roots[i].isConnected) _roots[keep++] = _roots[i];
        }
        _roots.length = keep;
        // One batch for every root, so mounting priority applies across all of them
        if (keep > 0) {
            const components = typeof window !== "undefined" && window.gia ? window.gia.components : {};
            loadComponentsIn(components, _roots);
        }
        _roots.length = 0;
        _rootSet.clear();
    }
}

export function initObserver() {
    if (typeof __GIA_MINI__ !== "undefined" && __GIA_MINI__) return;
    if (typeof document === "undefined") return;

    if (config.get("autoMountComponents") && !shared.observer) {
        const root = document.documentElement || document.body;
        if (!root) return;
        const ObserverClass =
            (typeof window !== "undefined" && window.MutationObserver) ||
            (typeof MutationObserver !== "undefined" ? MutationObserver : null);
        if (!ObserverClass) return;
        shared.observer = new ObserverClass(handleMutations);
        shared.observer.observe(root, {
            childList: true,
            subtree: true,
            // Only the component attribute, so other attribute changes cost nothing
            attributes: true,
            attributeOldValue: true,
            attributeFilter: [`${config.get("attrPrefix")}-component`],
        });
    } else if (!config.get("autoMountComponents") && shared.observer) {
        shared.observer.disconnect();
        shared.observer = null;
    }
}

// Intercept config.set (once per page) to start/stop the observer when 'autoMountComponents' changes
if ((typeof __GIA_MINI__ === "undefined" || !__GIA_MINI__) && !shared.hooked) {
    shared.hooked = true;
    const originalConfigSet = config.set;
    config.set = function (name, value) {
        originalConfigSet.call(this, name, value);
        if (name === "autoMountComponents") {
            initObserver();
        } else if (name === "attrPrefix" && shared.observer) {
            // Re-observe so the attribute filter follows the new prefix
            shared.observer.disconnect();
            shared.observer = null;
            initObserver();
        }
    };
}

export default initObserver;
