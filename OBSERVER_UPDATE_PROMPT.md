# Updating Components to Use Global Observers

A recent framework update to `gia` has added global `ResizeObserver` and `IntersectionObserver` support directly to `BaseComponent`. This change is designed to drastically improve memory efficiency by avoiding the creation of new observer instances for every component instance.

## What changed?

1. **New API Methods in `BaseComponent`:**
   - `this.observeIntersection(element, callback, options)`
   - `this.unobserveIntersection(element, callback)` (optional)
   - `this.observeResize(element, callback)`
   - `this.unobserveResize(element, callback)` (optional)

2. **Automatic Cleanup:**
   - Observers registered via `this.observeIntersection` and `this.observeResize` are automatically unobserved during the component's internal `_destroy` phase (which is called prior to `unmount`). You no longer need to explicitly `unobserve` or `disconnect` them in your custom `unmount()` function unless you want to stop observing before unmounting.

## Instructions for Components

Please update the examples (e.g., `ImageHolder.js`, `VideoHolder.js`, `Header.js`) to use these new methods.

### Example Update (Intersection Observer)

**Old Way:**
```javascript
mount() {
    this.intersectionObserver = new IntersectionObserver(this.handleIntersect.bind(this), {
        rootMargin: "0px",
        threshold: 0.01
    });
    this.intersectionObserver.observe(this.element);
}

unmount() {
    if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
    }
}
```

**New Way:**
```javascript
mount() {
    this.observeIntersection(this.element, this.handleIntersect, {
        rootMargin: "0px",
        threshold: 0.01
    });
}

unmount() {
    // No explicit unobserve required for cleanup!
}
```

### Example Update (Resize Observer)

**Old Way:**
```javascript
mount() {
    this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
    this.resizeObserver.observe(this.element);
}

unmount() {
    if (this.resizeObserver) {
        this.resizeObserver.disconnect();
    }
}
```

**New Way:**
```javascript
mount() {
    this.observeResize(this.element, this.handleResize);
}

unmount() {
    // No explicit unobserve required for cleanup!
}
```

Note: Since `BaseComponent` uses `_autoBindFunctions`, you typically don't need to manually `.bind(this)` on callbacks, though it is still safe to do so. The callbacks passed to `observeResize` and `observeIntersection` will receive an array of entries as their first argument, exactly like the native observer APIs.