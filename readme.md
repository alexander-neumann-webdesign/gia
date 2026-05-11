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

When using the UMD build, components can be registered using `gia.register()` to make them discoverable globally.

## Architecture & Usage

Gia's approach is to provide a structured lifecycle and state management system strictly bound to specific DOM nodes.

### Defining a Component

To create a new component, extend `gia.Component` (or `gia.BaseComponent` for an even lighter footprint without code-splitting polyfills). You define your references in the constructor, handle asynchronous loading in `require()`, and attach logic in `mount()`.

```javascript
import { Component, loadComponents } from "gia";

class SampleComponent extends Component {
    constructor(element) {
        super(element);
        // Define your expected references
        this.ref = {};
    }

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
```

## Global Configuration (`gia.config`)

Gia provides a global `config` object to customize the framework's behavior.

```javascript
import { config } from "gia";

// Enable detailed logging (useful during development)
config.set("log", true);

// Change the default attribute prefix (defaults to 'data')
// e.g., setting to 'g' means Gia looks for 'g-component' instead of 'data-component'
config.set("attrPrefix", "data");

// Automatically mount/unmount components as they enter/leave the DOM via MutationObserver
config.set("autoMountComponents", true);

// Automatically parse and bind `data-action` listeners inside components
config.set("autoBindActions", true);
```

## Loading Components

How you initialize components depends on your `autoMountComponents` configuration.

### Manual Loading (Default)
When `autoMountComponents` is `false` (the default for performance), you must explicitly tell Gia to search a DOM context and attach components. This is typically done on initial page load, and again whenever you inject new HTML.

```javascript
import { loadComponents } from "gia";
import MyComponent from "./MyComponent";

const components = {
    MyComponent: MyComponent,
    AnotherComponent: AnotherComponent
};

// Mounts all instances found within document.documentElement
loadComponents(components);

// Later, if you fetch HTML via AJAX and inject it into '#ajax-container':
const container = document.getElementById("ajax-container");
loadComponents(components, container);
```

### Auto-mounting Loading
If you enable `config.set("autoMountComponents", true)`, Gia uses a `MutationObserver`. You still call `loadComponents` once to register the component classes, but Gia will automatically detect newly injected HTML and mount/unmount instances automatically.

```javascript
import { config, loadComponents } from "gia";

config.set("autoMountComponents", true);
loadComponents({ MyComponent });
// Now, anytime `<div data-component="MyComponent">` is added to the DOM, it mounts automatically.
```

## The Ref System (`this.ref`)

Gia abstracts querying the DOM by automatically finding and caching elements marked with `data-ref` within the component's root `this.element`. It uses a highly optimized single-pass pre-indexing strategy.

To use refs, you must define the `this.ref` object in the constructor to tell Gia what to look for:
- Use `null` to indicate a **single element**.
- Use `[]` to indicate an **array of elements**.
- Use an empty object `{}` if you want Gia to automatically grab everything it finds as an array.

```html
<div data-component="MyComponent">
    <button data-ref="trigger">Click Me</button>
    <div data-ref="items">Item 1</div>
    <div data-ref="items">Item 2</div>

    <!-- References can also be namespaced if components overlap -->
    <div data-ref="MyComponent:nestedItem">Nested</div>
</div>
```

```javascript
class MyComponent extends Component {
    constructor(element) {
        super(element);
        // Explicitly define the expected structure
        this.ref = {
            trigger: null, // Resolves to a single HTMLElement
            items: [],     // Resolves to an Array of HTMLElements
        };
    }

    mount() {
        console.log(this.ref.trigger);      // <button>
        console.log(this.ref.items.length); // 2
    }
}
```

## Event Binding (`data-action`)

Manually querying elements and binding event listeners can be tedious. If you enable `config.set("autoBindActions", true)`, Gia automatically maps `data-action` attributes to component methods.

The format is `data-action="eventName->methodName"`. You can define multiple actions separated by spaces.

```html
<div data-component="ClickableComponent">
    <!-- Triggers handleClick on click, and handleHover on mouseenter -->
    <button data-action="click->handleClick mouseenter->handleHover">Action Button</button>
</div>
```

```javascript
class ClickableComponent extends Component {
    constructor(element) {
        super(element);
        this.ref = {};
    }

    handleClick(event) {
        console.log("Clicked!", event.target);
    }

    handleHover(event) {
        console.log("Hovered!");
    }
}
```
*Note: Because `BaseComponent` automatically calls `_autoBindFunctions`, you do not need to manually `.bind(this)` on your methods. `this` inside `handleClick` will safely point to the component instance.*

## State Management & Reactivity

Gia encourages reactive DOM updates via `this.setState()` and `stateChange()`. This abstracts away direct DOM manipulation into a clean flow, and uses `requestAnimationFrame` to batch DOM updates for maximum performance.

### Defining and Mutating State
State should only be updated using `this.setState()`. When the state object is merged, Gia calculates the differences. If changes occur, it queues a call to `stateChange()` in the next animation frame.

```javascript
class CounterComponent extends Component {
    constructor(element) {
        super(element);
        // Define refs
        this.ref = {
            button: null,
            display: null
        };
        // Define initial state
        this.state = {
            count: 0
        };
    }

    mount() {
        this.ref.button.addEventListener('click', () => {
            // Update state. This does NOT change the DOM immediately.
            this.setState({ count: this.state.count + 1 });
        });
    }

    // Called automatically by Gia via requestAnimationFrame when state changes
    stateChange(changes) {
        // 'changes' only contains keys that actually changed
        if ('count' in changes) {
            this.ref.display.textContent = this.state.count;
        }
    }
}
```

### State-to-Attribute Auto-binding
As a bonus, `BaseComponent` automatically maps `boolean` and `string` state values directly to `data-` attributes on the component's root element (`this.element`). CamelCase state keys are converted to kebab-case.

```javascript
this.setState({
    isOpen: true,
    status: 'loading',
    items: [1, 2, 3] // Arrays and objects are ignored by the attribute binder
});
```
This automatically updates the root element:
```html
<div data-component="MyComponent" data-is-open="true" data-status="loading">
```
This allows you to write highly performant CSS that reacts to component state without writing manual class-toggling logic.

## Helper Functions

Gia includes several helpful utilities to work with components programmatically.

### `getComponentFromElement(element)`
If you need to access a component instance from outside (e.g., from another vanilla JS script or global event), you can retrieve it directly from the DOM node.

```javascript
import { getComponentFromElement } from "gia";

const el = document.getElementById("my-component-div");
const instance = getComponentFromElement(el);

if (instance) {
    // You can now call public methods or access state
    console.log(instance.state.isOpen);
}
```

### Eventbus
Gia provides a native `EventTarget` based global event bus to decouple components. It allows components to communicate globally without needing direct references to each other.

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

### Dynamic Script Loading
Avoid blocking the main thread or dealing with race conditions when loading external scripts by using the `loadScript` utility inside the `require` lifecycle.

```javascript
// Expects an element: <script id="vendor-js" data-src="..."></script>
async require() {
    await this.loadScript('vendor', 'VendorGlobal');
}
```

## Examples

The `examples/` directory contains a comprehensive set of real-world use cases demonstrating best practices with Gia. These examples include advanced patterns like URL hash-syncing, hardware-accelerated scroll snapping, reactive accordions, and high-performance parallax scroll-bound animations.