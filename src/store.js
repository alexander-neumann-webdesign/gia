/**
 * Global store for component instances to prevent memory leaks.
 * WeakMap guarantees that if the DOM element is removed, the component instance
 * is garbage collected.
 */
export const components = new WeakMap();
