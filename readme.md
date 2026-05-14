# Gia

*Note: This is a personal fork of the original Gia framework. It contains numerous enhancements, custom examples, and optimizations.*

### 1. Ultra-Lightweight & Performance-First
At roughly **~4.12 KB** (minified and gzipped), it is practically invisible on the network. More importantly, it is built with performance in mind: it uses `requestAnimationFrame` to batch DOM mutations (preventing layout thrashing) and relies entirely on native Web APIs (like `EventTarget` for its global event bus) rather than shipping heavy abstractions.

### 2. Solves "Vanilla JS Spaghetti"
Writing Vanilla JS for traditional websites often leads to messy event listeners and memory leaks. Gia solves this by introducing a strict lifecycle (`mount`, `require`, `unmount`). When a DOM node is removed, Gia cleans up the component, preventing the memory leaks that often plague traditional multi-page apps.

### 3. Quality of Life Features
Gia provides several excellent developer experience (DX) improvements that usually require writing boilerplate:
- **Auto-binding**: It automatically binds component methods and DOM events via `data-action` attributes.
- **Ref System**: Instead of writing endless `document.querySelector` calls, you use `data-ref` in your HTML, and Gia maps them to a `this.ref` object.
- **Unified Observers**: Instead of instantiating new `IntersectionObserver` or `ResizeObserver` instances for every component (which drains CPU), Gia shares a single global observer across all components.

### 4. Built for Code-Splitting
The addition of the `require()` lifecycle method is brilliant. It allows you to dynamically import heavy third-party libraries (like map wrappers or physics engines) only if the component actually exists on the page, keeping your initial bundle size tiny.

## Final Verdict
Gia is an excellent framework for "Islands of Interactivity." If you are building a traditional server-rendered website using Django, Laravel, Ruby on Rails, Astro, or purely static HTML, and you just want to sprinkle in some interactive components (sliders, modals, maps, AJAX forms) without shipping a massive JavaScript payload, Gia is a fantastic tool. It gives you the structure of modern component-based UI without abandoning the simplicity of Vanilla JS.

## Table of Contents
- [Final Verdict](#final-verdict)
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
        this.setState({
            count: 0
        });
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
        this.setState({
            isOpen: false,
            status: 'idle',
            items: []
        });
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
        this.setState({ isOpen: true });
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

### Navigation & Layout
*   **Header**: A scroll-aware site header component that responds to scroll direction and offset. It intelligently caches layout dimensions and uses `requestAnimationFrame` to apply CSS transforms without layout thrashing.
*   **OffCanvasMenu**: A slide-out navigation menu demonstrating state-based CSS class toggling, inert trapping for accessibility, and robust click-outside handling to seamlessly close the menu.
*   **Tabs**: A classic tabbed interface component relying on Gia's state management to toggle active views and ARIA attributes. Also supports URL hash syncing for bookmarkable tabs.
*   **Accordion**: A semantic, highly-accessible accordion utilizing native `<details>` and `<summary>` tags. Manages state reactively to auto-close sibling panels and syncs active open states with the URL hash for deep linking.

### UI Components
*   **Modal**: An accessible dialog window leveraging the native `<dialog>` element. It supports complex triggering via external targets, click-outside-to-close logic, and manages URL hash syncing.
*   **Tooltip**: A robust tooltip component asynchronously importing the Floating UI library via `require()` to calculate precise, collision-aware absolute positioning.
*   **ThemeToggle**: A dark/light mode toggle switch that interacts with `localStorage` and optionally mutates global root state to persist user visual preferences.
*   **ClipboardCopy**: A minimal utility component that seamlessly copies text to the user's clipboard, demonstrating how to use `this.setState` to provide temporary visual UI feedback (e.g., "Copied!") after a successful action.
*   **CustomCursor**: A performant custom cursor replacement featuring frame-rate independent exponential smoothing for smooth magnetic snapping and morphing over interactive elements.
*   **TextFit**: A typography utility component that integrates the `fitty` library to perfectly scale text to fit its container, automatically handling resize observation and instance cleanup.
*   **QRCode**: A component that dynamically generates SVG QR codes. It asynchronously loads the `qrcode-generator` library via `require()` only when needed and reacts to state changes to update the code.

### Media & Galleries
*   **Slider**: A swipeable, touch-friendly content slider demonstrating advanced pointer event handling and batched hardware-accelerated CSS transforms via `requestAnimationFrame`.
*   **LightboxGallery**: A fully-featured gallery component demonstrating dynamic script loading by pulling in the PhotoSwipe library only when actually clicked, handling complex DOM structure mappings and global event bindings.
*   **ImageHolder**: A highly optimized image component providing a buttery-smooth parallax implementation. Tracks viewport entrance to lazy load sources and automatically calculates and sets the `sizes` attribute dynamically based on exact layout dimensions.
*   **VideoHolder**: A lazy-loading video component that automatically pauses playback when scrolled out of view to save system resources. Uses Intersection Observers to handle complex, asynchronous playback promise logic.
*   **ImageComparison**: A performant before/after media comparison component. It uses a visually hidden native range slider to update a CSS variable, dynamically driving a `clip-path` mask over stacked images.

### Scroll & Animation Effects
*   **Reveal**: A highly optimized, stagger-ready scroll-reveal component that fades and translates elements into view. It leverages the globally shared `observeIntersection` API to handle hundreds of elements without memory leaks or performance degradation.
*   **Marquee**: An infinite-scrolling marquee component that automatically clones elements and handles continuous, sub-pixel perfect `requestAnimationFrame` updates, complete with Lenis smooth-scroll velocity integration.
*   **SplitText**: A specialized typography component for complex text animations. It intelligently divides text into lines, words, and characters using the native `Intl.Segmenter` API while perfectly preserving screen reader accessibility.

### Data & State Management
*   **FilterableList**: A powerful filtering and sorting component for item collections. It synchronizes state with URL search parameters and utilizes the modern View Transitions API for buttery-smooth, hardware-accelerated DOM reordering.

### Forms
*   **Form**: An AJAX-powered form component with built-in HTML5 validation handling, animated SVG loading spinners, and state-driven success/error messaging.
*   **MultipleSelect**: A wrapper component for `multiple-select-vanilla`. It dynamically loads its dependencies and exposes standard value getters and setters for easy integration with standard form data collection.
*   **RangeSlider**: A flexible range slider wrapping the `noUiSlider` library. It implements two-way data binding, seamlessly syncing its visual state with native hidden inputs to ensure compatibility with standard form submissions.

### Maps
*   **MapLibreMap**: A MapLibre GL wrapper component that asynchronously loads the massive mapping library and styles on-demand, dynamically calculating and framing bounding boxes for location markers.
*   **OpenStreetMap**: A Leaflet-based interactive map component that asynchronously loads its dependencies and styles, plots markers with popups, and minimizes attribution noise.

### Complex Apps
*   **MatterPhysicsBackground**: An interactive physics-based background canvas utilizing Matter.js. Complete with responsive resizing, automatic pausing via IntersectionObserver to save CPU resources, and `prefers-reduced-motion` support.
*   **TodoApp**: A fully-featured todo application demonstrating complex state arrays, local storage syncing, computed properties (like remaining tasks), and accessible ARIA live regions for screen readers.
*   **PongGame**: A complete, playable Pong game built entirely within a single Gia component. Demonstrates a custom game loop running within `requestAnimationFrame`, keyboard input handling, collision logic, scoring state, and Canvas API drawing.

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