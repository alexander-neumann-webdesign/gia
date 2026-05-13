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


## Table of Contents
- [Features & Benefits](#features--benefits)
- [Installation](#installation)
- [Architecture & Usage](#architecture--usage)
- [Global Configuration (`gia.config`)](#global-configuration-giaconfig)
- [Loading Components](#loading-components)
- [Component Options (`data-options`)](#component-options-data-options)
- [The Ref System (`this.ref`)](#the-ref-system-thisref)
- [Event Binding (`data-action`)](#event-binding-data-action)
- [State Management & Reactivity](#state-management--reactivity)
- [Helper Functions](#helper-functions)
- [Examples](#examples)
- [Bonus Tip: Gia and Swup](#bonus-tip-gia-and-swup)

## Installation

You can install Gia via npm or simply include it via a script tag.

### NPM


```javascript
import { Component, loadComponents } from "gia";
```

### Script Tag (UMD)

```html
<script src="./dist/gia.umd.js"></script>
```

When using the UMD build, components can be registered using `gia.register()` to make them discoverable globally.

## Architecture & Usage

Gia's approach is to provide a structured lifecycle and state management system strictly bound to specific DOM nodes. The `eventbus` is powered by the native `EventTarget` API. State management optimizes render performance through shallow comparison in `setState` and uses `requestAnimationFrame` for DOM batching.

### Defining a Component (`Component` vs `BaseComponent`)

Gia provides two base classes you can extend:

1.  **`BaseComponent`**: The core, ultra-lightweight base class. It manages DOM element attachment (`this.element`), component naming (`this._name`), and configuration options parsing from attributes. It handles state management, event auto-binding, the ref system, and standard lifecycles (`mount`, `unmount`). Use this by default for maximum performance.
2.  **`Component`**: Extends `BaseComponent` by adding an asynchronous `require()` lifecycle method that executes *before* `mount()`. Use this when you need to dynamically load external scripts or heavy dependencies (like a vendor library) only when the component is actually present on the page.

To create a new component, define your defaults in the constructor, handle optional asynchronous loading in `require()`, and attach logic in `mount()`.

```html
<div data-component="SampleComponent">
    <!-- Component content goes here -->
</div>
```

```javascript
import { Component } from "gia"; // Or import { BaseComponent } from "gia";

class SampleComponent extends Component {
    constructor(element) {
        super(element);
    }

    // 1. Optional: Asynchronously load heavy dependencies
    // (Only available if extending Component, not BaseComponent)
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

```html
<div id="ajax-container">
    <div data-component="MyComponent"></div>
    <div data-component="AnotherComponent"></div>
</div>
```

```javascript
import { loadComponents, Component } from "gia";

class MyComponent extends Component {
    mount() { console.log("MyComponent mounted"); }
}

class AnotherComponent extends Component {
    mount() { console.log("AnotherComponent mounted"); }
}

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
By default, the `MutationObserver`-based auto-mounting capability is disabled. If you enable `config.set("autoMountComponents", true)`, Gia uses a `MutationObserver`. You still call `loadComponents` once to register the component classes, but Gia will automatically detect newly injected HTML and mount/unmount instances automatically.

```html
<!-- Initial HTML structure -->
<div id="app">
    <div data-component="MyComponent">Initial Component</div>
</div>
```

```javascript
import { config, loadComponents } from "gia";

config.set("autoMountComponents", true);
loadComponents({ MyComponent });
// Now, anytime `<div data-component="MyComponent">` is added to the DOM, it mounts automatically.
// Example: document.getElementById("app").innerHTML += '<div data-component="MyComponent">Dynamically Injected</div>';
```

## Component Options (`data-options`)

You can pass configuration options directly from HTML into your component via the `data-options` attribute. The attribute must contain valid JSON. Gia parses this and merges it with default options defined in your constructor.

```html
<div data-component="SliderComponent" data-options='{"speed": 500, "loop": true}'>
    <!-- Slider content -->
</div>
```

```javascript
class SliderComponent extends Component {
    constructor(element) {
        super(element);

        // Define defaults and merge with `data-options`
        this.options = {
            speed: 300,
            loop: false,
            autoplay: false
        };
    }

    mount() {
        console.log(this.options.speed); // 500
        console.log(this.options.loop);  // true
    }
}
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

Here is a simple click example:

```html
<div data-component="SimpleClickComponent">
    <button data-action="click->handleClick">Action Button</button>
</div>
```

```javascript
class SimpleClickComponent extends Component {
    constructor(element) {
        super(element);
    }

    handleClick(event) {
        console.log("Clicked!", event.target);
    }
}
```

And a more complicated example handling hover enter and leave states on a card element:

```html
<div data-component="HoverCardComponent">
    <div class="card" data-action="mouseenter->handleEnter mouseleave->handleLeave">
        Hover over me!
    </div>
</div>
```

```javascript
class HoverCardComponent extends Component {
    constructor(element) {
        super(element);
    }

    handleEnter(event) {
        event.target.classList.add("is-hovered");
    }

    handleLeave(event) {
        event.target.classList.remove("is-hovered");
    }
}
```
*Note: Because `BaseComponent` automatically calls `_autoBindFunctions`, you do not need to manually `.bind(this)` on your methods. `this` inside `handleClick` will safely point to the component instance.*

## State Management & Reactivity

Gia encourages reactive DOM updates via `this.setState()` and `stateChange()`. This abstracts away direct DOM manipulation into a clean flow, and uses `requestAnimationFrame` to batch DOM updates for maximum performance.

### Defining and Mutating State
State should only be updated using `this.setState()`. When the state object is merged, Gia calculates the differences. If changes occur, it queues a call to `stateChange()` in the next animation frame.

Here is a minimal Counter example that also makes use of `data-action` for cleaner event binding:

```html
<div data-component="CounterComponent">
    <button data-action="click->increment">Increment</button>
    <div data-ref="display">0</div>
</div>
```

```javascript
class CounterComponent extends Component {
    constructor(element) {
        super(element);
        // Define refs
        this.ref = {
            display: null
        };
        // Define initial state
        this.state = {
            count: 0
        };
    }

    increment() {
        // Update state. This does NOT change the DOM immediately.
        this.setState({ count: this.state.count + 1 });
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

```html
<div data-component="StateExampleComponent">
    <!-- Component content goes here -->
</div>
```

```javascript
import { Component } from "gia";

class StateExampleComponent extends Component {
    constructor(element) {
        super(element);
        this.state = {
            isOpen: false,
            status: 'idle',
            items: []
        };
    }

    mount() {
        this.setState({
            isOpen: true,
            status: 'loading',
            items: [1, 2, 3] // Arrays and objects are ignored by the attribute binder
        });
    }
}
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

```html
<div id="my-component-div" data-component="MyComponent"></div>
```

```javascript
import { getComponentFromElement, Component } from "gia";

class MyComponent extends Component {
    constructor(element) {
        super(element);
        this.state = { isOpen: true };
    }
}

// Assume MyComponent is registered/loaded
const el = document.getElementById("my-component-div");
const instance = getComponentFromElement(el);

if (instance) {
    // You can now call public methods or access state
    console.log(instance.state.isOpen); // true
}
```

### `createInstance(element, componentName, component, options)`
Manually creates and attaches a component instance to a specific DOM element.

```javascript
import { createInstance } from "gia";
import MyComponent from "./MyComponent";

const element = document.getElementById("my-element");
const instance = createInstance(element, "MyComponent", MyComponent, { someOption: true });
```

### `destroyInstance(element)`
Destroys the component instance attached to a specific DOM element, triggering its `unmount` lifecycle method and cleaning up memory references.

```javascript
import { destroyInstance } from "gia";

const element = document.getElementById("my-element");
destroyInstance(element);
```

### `removeComponents(context)`
Destroys and removes all component instances within a given DOM context. By default, it searches the entire `document.documentElement`.

```javascript
import { removeComponents } from "gia";

const container = document.getElementById("ajax-container");
removeComponents(container);
```

### Eventbus
Gia provides a native `EventTarget` based global event bus to decouple components. It allows components to communicate globally without needing direct references to each other.

```html
<div data-component="ComponentA"></div>
<div data-component="ComponentB"></div>
```

```javascript
import { eventbus, Component } from "gia";

class ComponentA extends Component {
    mount() {
        eventbus.emit("customEvent", { message: "Hello World" });
    }
}

class ComponentB extends Component {
    mount() {
        eventbus.on("customEvent", this.handleEvent);
    }

    handleEvent(event) {
        console.log(event.detail.message); // "Hello World"
    }
}
```

### Dynamic Script and Style Loading
Avoid blocking the main thread or dealing with race conditions when loading external scripts and styles by using the `loadScript` and `loadStyle` utilities inside the `require` lifecycle. The target script or link elements can be anywhere in the document, such as the `<head>`.

```html
<!-- Usually in the document <head> or at the end of the <body> -->
<script id="vendor-js" data-src="..."></script>
<link id="vendor-css" rel="stylesheet" data-href="...">

<!-- The component instance -->
<div data-component="MyComponent">
    <!-- Component content goes here -->
</div>
```

```javascript
import { Component } from "gia";

class MyComponent extends Component {
    async require() {
        // Loads the script and waits for the global 'VendorGlobal' to be available
        // Also lazy-loads the associated stylesheet
        await Promise.all([
            this.loadScript('vendor-js', 'VendorGlobal'),
            this.loadStyle('vendor-css')
        ]);
    }

    mount() {
        console.log("Vendor library loaded:", window.VendorGlobal);
    }
}
```

### Observer API (Resize & Intersection)
Gia provides unified, global observers for intersection and resize events via `observeIntersection` and `observeResize` inherited from `BaseComponent`. By using a shared `IntersectionObserver` or `ResizeObserver` across multiple components, it significantly reduces memory overhead and improves performance over instantiating observers inside individual components. Best of all, Gia automatically unobserves elements during the `unmount` phase.

```html
<div data-component="VisibilityComponent">
    <div data-ref="items" class="item">Item 1</div>
    <div data-ref="items" class="item">Item 2</div>
</div>
```

```javascript
class VisibilityComponent extends Component {
    constructor(element) {
        super(element);
        this.ref = { items: [] };
    }

    mount() {
        // Observe intersection (uses a shared global IntersectionObserver instance)
        this.ref.items.forEach(item => {
            this.observeIntersection(item, this.handleIntersection, { threshold: 0.5 });
        });

        // Observe resize (uses a shared global ResizeObserver instance)
        this.observeResize(this.element, this.handleResize);
    }

    handleIntersection([entry]) {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            // Stop observing if needed (or Gia will automatically clean it up on unmount)
            this.unobserveIntersection(entry.target, this.handleIntersection);
        }
    }

    handleResize([entry]) {
        console.log("Component resized:", entry.contentRect.width);
    }
}
```

## Examples

The `examples/` directory contains a comprehensive set of real-world use cases demonstrating best practices with Gia. These examples include advanced patterns like URL hash-syncing, hardware-accelerated scroll snapping, reactive accordions, and high-performance parallax scroll-bound animations.

You can preview all examples locally by opening `demo/index.html` in your browser. Or check out the [Live Demo](https://alexander-neumann-webdesign.github.io/gia/demo/).

### UI & Interactive Elements
*   **Accordion**: A semantic and accessible accordion component utilizing native `<details>` and `<summary>` elements. It manages state reactively to ensure only one panel remains open at a time if desired, and syncs open states with the URL hash.
*   **ClipboardCopy**: A simple utility component that copies text from a referenced element to the user's clipboard. It showcases how to use `this.setState` to provide temporary visual feedback after a successful action.
*   **FilterableList**: A robust filtering and sorting component for collections of items. It intelligently manages state via URL parameters for deep linking and utilizes the View Transitions API for seamless, hardware-accelerated DOM reordering and filtering animations.
*   **Modal**: An accessible dialog window component that utilizes the native `<dialog>` element. It supports triggering via external targets and manages URL hash syncing for easy direct linking to open modals.
*   **OffCanvasMenu**: A slide-out navigation menu component triggered by user interaction. It demonstrates state-based class toggling and how to handle clicks outside the component to close the menu.
*   **Slider**: A swipeable content slider demonstrating complex touch event handling and hardware-accelerated CSS transforms. It manages active slide states and updates pagination indicators reactively.
*   **SplitText**: A performant text splitting component designed for complex typography animations. It intelligently divides text into lines, words, and characters using the native `Intl.Segmenter` API, while automatically preserving accessibility for screen readers.
*   **Tabs**: A robust tabbed interface component that relies on state management to switch active views. It also supports URL hash syncing so users can bookmark and load specific tabs on page load.
*   **ThemeToggle**: A dark/light mode toggle switch component that persists user preference. It shows how Gia components can interact with `localStorage` and mutate global state efficiently.
*   **Tooltip**: A dynamic tooltip component using the Floating UI library via asynchronous dynamic import inside `require()`, providing perfectly positioned floating elements.

### Media & Scroll Effects
*   **Header**: A scroll-aware site header component that responds to scroll direction and offset. It intelligently caches layout dimensions and uses `requestAnimationFrame` to apply transforms without layout thrashing.
*   **ImageHolder**: A highly optimized image component that provides a smooth parallax implementation and tracks viewport entrance to lazy load sources. It automatically calculates and sets the `sizes` attribute dynamically based on the image's layout dimensions for perfect responsive loading.
*   **LightboxGallery**: A fully featured gallery component demonstrating dynamic script loading by pulling in a vendor library only when required. It handles complex DOM structures and global event bindings.
*   **Marquee**: An infinite scrolling marquee component cloning elements and handling continuous requestAnimationFrame updates with Lenis scroll velocity integration.
*   **Reveal**: A highly optimized scroll-reveal component that fades and translates elements into view as they enter the viewport. It leverages the global `observeIntersection` API to handle potentially hundreds of elements without performance degradation.
*   **VideoHolder**: A lazy-loading video component that pauses playback when scrolled out of view to save system resources. It uses intersection observers to handle complex playback logic asynchronously.

### Advanced Apps & Logic
*   **TodoApp**: A full todo application demonstrating complex state arrays, local storage syncing, computed properties (like remaining tasks), and accessible ARIA live regions for screen readers.
*   **PongGame**: A complete Pong game built inside a Gia component to demonstrate a complex game loop running within `requestAnimationFrame`, keyboard input handling, scoring state, and canvas drawing.

## Bonus Tip: Gia and Swup

Gia pairs exceptionally well with page transition libraries like [Swup](https://swup.js.org/). Because Gia relies on standard DOM manipulation and clearly defined `mount()` and `unmount()` lifecycles, it perfectly complements Swup's approach to replacing only specific containers.

### Global Integration

You can easily tie Gia's loading mechanisms directly into Swup's lifecycle hooks. By listening to `content:replace`, you can initialize new components when Swup injects new HTML. By listening to `content:remove`, you can ensure that memory is freed properly by destroying old components.

```javascript
import { loadComponents, removeComponents } from "gia";
import Swup from "swup";
import MyComponent from "./MyComponent";

const components = { MyComponent };

const swup = new Swup({
    containers: ["#swup-container"]
});

// Mount components on initial load
loadComponents(components, document.getElementById("swup-container"));

// Re-mount components when Swup replaces the content
swup.hooks.on("content:replace", () => {
    loadComponents(components, document.getElementById("swup-container"));
});

// Cleanup components right before Swup removes the old content
swup.hooks.on("content:remove", () => {
    removeComponents(document.getElementById("swup-container"));
});
```

### Component-Level Integration

Sometimes individual components need to react to page transitions (e.g., closing an open menu before the page navigates away, or resetting scroll-dependent state). You can safely check for Swup and bind to its hooks within your component's lifecycle:

```javascript
import { Component } from "gia";

class OffCanvasMenu extends Component {
    mount() {
        // ... standard mount logic ...

        // Close the menu if a link inside it triggers a Swup transition
        if (window.swup) {
            this.handleSwupTransition = () => {
                this.setState({ isOpen: false });
            };
            window.swup.hooks.on("animation:out:start", this.handleSwupTransition);
        }
    }

    unmount() {
        // Always clean up the hook listener
        if (window.swup && this.handleSwupTransition) {
            window.swup.hooks.off("animation:out:start", this.handleSwupTransition);
        }
    }
}
```