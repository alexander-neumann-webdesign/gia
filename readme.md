# Gia

A high-performance, minimalistic JavaScript framework designed for progressively enhancing server-rendered websites.

Gia provides a robust architectural foundation with a minimal footprint: **~3.53 Kb minified and gzipped** for the complete UMD build, and **~4.05 Kb** for the ESM build.

## Features & Benefits

- **Performance-First Architecture:** Leverages `requestAnimationFrame` for batched DOM mutations, avoiding layout thrashing. Components handle state reactively and efficiently update the DOM only when necessary.
- **Native Web APIs:** Built on top of standard browser APIs, avoiding the need for heavy abstractions or Virtual DOMs. The global event bus relies on the native `EventTarget` interface.
- **Progressive Enhancement:** Seamlessly attaches scoped behavior to existing server-rendered HTML using data attributes.
- **Auto-binding Magic:** Automatically binds component methods (`_autoBindFunctions`) and DOM events via `data-action` attributes (`_autoBindActions`), drastically reducing boilerplate code.
- **Optimized Ref Mapping:** Automatically maps complex DOM structures to internal component references (`this.ref`) via `data-ref` attributes, with $O(N+M)$ performance parsing.
- **Built-in Global Features:** An optional `MutationObserver`-powered auto-mounting capability allows you to handle dynamic content (e.g., AJAX loaded content) transparently.
- **Code Splitting Ready:** Natively supports dynamic imports via the `require()` component lifecycle method to defer non-essential library loading.

## Installation

You can install Gia via npm or simply include it via a script tag.

### NPM

```shell
npm install gia --save
```

```javascript
import { Component, loadComponents } from "gia";
```

### Script Tag (UMD)

```html
<script src="./dist/gia.umd.js"></script>
```

When using the UMD build, components can be registered using `gia.register()` to make them discoverable.

## Architecture & Usage

Gia's approach is to provide a structured lifecycle and state management system strictly bound to specific DOM nodes.

### Defining a Component

To create a new component, extend `gia.Component` (or `gia.BaseComponent` for an even lighter footprint without code-splitting polyfills).

```javascript
import { Component, loadComponents } from "gia";

class SampleComponent extends Component {
    // 1. Optional: Asynchronously load heavy dependencies
    async require() {
        // e.g., await this.loadScript('libraryId', 'GlobalVar');
    }

    // 2. Setup the component after require() resolves
    mount() {
        console.log("Component mounted on:", this.element);
    }

    // 3. Cleanup when component is removed
    unmount() {
        console.log("Component unmounted");
    }
}

// Initialize the component
const components = { SampleComponent };
loadComponents(components);
```

### HTML Integration

Attach the component to an element using the `data-component` attribute.

```html
<div data-component="SampleComponent" data-options='{"theme": "dark"}'>
    <!-- Component scope -->
</div>
```

### References (`this.ref`)

Gia abstracts querying the DOM by resolving predefined `data-ref` nodes efficiently. Define expected refs in the component constructor.

```html
<div data-component="MyComponent">
    <button data-ref="trigger">Click Me</button>
    <div data-ref="items">Item 1</div>
    <div data-ref="items">Item 2</div>
</div>
```

```javascript
class MyComponent extends Component {
    constructor(element) {
        super(element);
        this.ref = {
            trigger: null, // Resolves to a single HTMLElement
            items: [],     // Resolves to an Array of HTMLElements
        };
    }

    mount() {
        console.log(this.ref.trigger);
        console.log(this.ref.items.length); // 2
    }
}
```

### Event Binding (`data-action`)

Manually binding event listeners can be tedious. Gia solves this by automatically mapping `data-action` attributes to component methods.

```html
<div data-component="ClickableComponent">
    <button data-action="click->handleClick mouseenter->handleHover">Action Button</button>
</div>
```

```javascript
class ClickableComponent extends Component {
    handleClick(event) {
        console.log("Clicked!", event.target);
    }

    handleHover(event) {
        console.log("Hovered!");
    }
}
```
*Note: You do not need to `.bind(this)` on `handleClick` or `handleHover`. Gia automatically binds class methods.*

### State Management & Reactivity

Gia encourages reactive DOM updates via `this.setState()` and `stateChange()`. Changing the state triggers `stateChange` asynchronously via `requestAnimationFrame` to batch DOM updates.

```javascript
class CounterComponent extends Component {
    constructor(element) {
        super(element);
        this.state = {
            count: 0
        };
    }

    mount() {
        // Assume 'button' and 'display' are set up in this.ref
        this.ref.button.addEventListener('click', () => {
            this.setState({ count: this.state.count + 1 });
        });
    }

    // Only triggered when state values actually change
    stateChange(changes) {
        if ('count' in changes) {
            this.ref.display.textContent = this.state.count;
        }
    }
}
```

Additionally, `BaseComponent` automatically maps boolean and string states to `data-` attributes on the root element. If you set `this.setState({ isOpen: true, status: 'loading' })`, Gia automatically applies `data-is-open="true"` and `data-status="loading"` to `this.element`.

## Core API & Utilities

### Eventbus

Gia provides a native `EventTarget` based global event bus to decouple components.

```javascript
import { eventbus } from "gia";

// In Component A
eventbus.emit("customEvent", { message: "Hello World" });

// In Component B
mount() {
    eventbus.on("customEvent", this.handleEvent);
}

handleEvent(event) {
    console.log(event.detail.message); // "Hello World"
}
```

### Auto-mounting

To seamlessly initialize components on newly injected HTML (e.g., after an AJAX request), enable the auto-mount observer.

```javascript
import { config } from "gia";

config.set("autoMountComponents", true);
```

### Dynamic Script Loading

Avoid blocking the main thread or dealing with race conditions when loading external scripts by using the `loadScript` utility.

```javascript
// Expects an element: <script id="vendor-js" data-src="..."></script>
await this.loadScript('vendor', 'VendorGlobal');
```

## Examples

The `examples/` directory contains a comprehensive set of real-world use cases demonstrating best practices with Gia. These examples include advanced patterns like URL hash-syncing, hardware-accelerated scroll snapping, reactive accordions, and high-performance parallax scroll-bound animations.
