import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import loadComponents from '../src/loadComponents.js';

test.describe('Batched State & DOM Attribute Reflection (state.js)', () => {
    let dom;
    let window;
    let document;

    test.beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost/'
        });
        window = dom.window;
        document = window.document;

        const raf = (cb) => setTimeout(cb, 0);
        const caf = (id) => clearTimeout(id);
        window.requestAnimationFrame = raf;
        window.cancelAnimationFrame = caf;

        global.window = window;
        global.document = document;
        global.Element = window.Element;
        global.Node = window.Node;
        global.requestAnimationFrame = raf;
        global.cancelAnimationFrame = caf;
    });

    test.afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Element;
        delete global.Node;
        delete global.requestAnimationFrame;
        delete global.cancelAnimationFrame;
    });

    test('should batch multiple rapid setState() calls into a single stateChange invocation', async () => {
        let stateChangeCount = 0;
        let lastReceivedChanges = null;

        class StateComponent extends BaseComponent {
            stateChange(changes) {
                stateChangeCount++;
                lastReceivedChanges = { ...changes };
            }
        }

        const el = document.getElementById('test-el');
        loadComponents({ StateComponent }, document.body);

        const instance = window.gia && window.gia.components ? null : null;
        // Access component through DOM query
        const comp = el && el._gia_component ? el._gia_component : null;

        // Create explicit instance to test setState directly
        let testInstance;
        class DirectComp extends BaseComponent {
            mount() {
                testInstance = this;
            }
            stateChange(changes) {
                stateChangeCount++;
                lastReceivedChanges = { ...changes };
            }
        }

        const container = document.createElement('div');
        container.setAttribute('data-component', 'DirectComp');
        document.body.appendChild(container);
        loadComponents({ DirectComp }, document.body);

        // Rapid state mutations within the same tick
        testInstance.setState({ step: 1, active: false });
        testInstance.setState({ step: 2 });
        testInstance.setState({ title: 'Hello', active: true });

        // Synchronously, stateChange should NOT have fired yet
        expect(stateChangeCount).toBe(0);

        // Wait for scheduler flush (requestAnimationFrame)
        await new Promise((r) => setTimeout(r, 20));

        expect(stateChangeCount).toBe(1);
        expect(lastReceivedChanges).toEqual({
            step: 2,
            title: 'Hello',
            active: true
        });
        expect(testInstance.state).toEqual({
            step: 2,
            title: 'Hello',
            active: true
        });
    });

    test('should reflect boolean and string states to data-* attributes on the element', async () => {
        let testInstance;
        class AttrComp extends BaseComponent {
            mount() {
                testInstance = this;
            }
        }

        const el = document.createElement('div');
        el.setAttribute('data-component', 'AttrComp');
        document.body.appendChild(el);
        loadComponents({ AttrComp }, document.body);

        testInstance.setState({
            isOpen: true,
            statusMode: 'active',
            count: 42,            // numbers are reflected to attributes as strings
            nestedObj: { a: 1 }   // objects should NOT be reflected to attributes
        });

        await new Promise((r) => setTimeout(r, 20));

        // CamelCase should be translated to kebab-case
        expect(el.getAttribute('data-is-open')).toBe('true');
        expect(el.getAttribute('data-status-mode')).toBe('active');
        expect(el.getAttribute('data-count')).toBe('42');
        expect(el.hasAttribute('data-nested-obj')).toBe(false);

        // Toggle boolean to false
        testInstance.setState({ isOpen: false });
        await new Promise((r) => setTimeout(r, 20));

        expect(el.getAttribute('data-is-open')).toBe('false');
    });

    test('should support setState() called in constructor before mount', async () => {
        let testInstance;
        class ConstructorComp extends BaseComponent {
            constructor(element, options) {
                super(element, options);
                this.setState({
                    isExpanded: false,
                    theme: 'dark'
                });
            }
            mount() {
                testInstance = this;
            }
        }

        const el = document.createElement('div');
        el.setAttribute('data-component', 'ConstructorComp');
        document.body.appendChild(el);
        loadComponents({ ConstructorComp }, document.body);

        expect(testInstance.state.isExpanded).toBe(false);
        expect(testInstance.state.theme).toBe('dark');

        await new Promise((r) => setTimeout(r, 20));

        expect(el.getAttribute('data-is-expanded')).toBe('false');
        expect(el.getAttribute('data-theme')).toBe('dark');
    });

    test('should not trigger stateChange if setState is called with identical values', async () => {
        let stateChangeCount = 0;
        let testInstance;

        class IdenticalComp extends BaseComponent {
            mount() {
                testInstance = this;
                this.setState({ name: 'Alice' });
            }
            stateChange() {
                stateChangeCount++;
            }
        }

        const el = document.createElement('div');
        el.setAttribute('data-component', 'IdenticalComp');
        document.body.appendChild(el);
        loadComponents({ IdenticalComp }, document.body);

        await new Promise((r) => setTimeout(r, 20));
        expect(stateChangeCount).toBe(1);

        // Call again with the exact same value
        testInstance.setState({ name: 'Alice' });
        await new Promise((r) => setTimeout(r, 20));

        expect(stateChangeCount).toBe(1); // Should still be 1, ignored
    });

    test('should warn when assigning directly to this.state', () => {
        let testInstance;
        const originalWarn = console.warn;
        let warnedMessage = null;
        console.warn = (msg) => {
            warnedMessage = msg;
        };

        try {
            class WarnComp extends BaseComponent {
                mount() {
                    testInstance = this;
                }
            }

            const el = document.createElement('div');
            el.setAttribute('data-component', 'WarnComp');
            document.body.appendChild(el);
            loadComponents({ WarnComp }, document.body);

            testInstance.state = { test: 123 };
            expect(warnedMessage).toBe('Use setState instead.');
            expect(testInstance.state).toEqual({ test: 123 });
        } finally {
            console.warn = originalWarn;
        }
    });

    test('should support functional setState updater (prevState) => ({ ... })', async () => {
        let testInstance;
        let lastReceivedChanges = null;

        class FunctionalComp extends BaseComponent {
            constructor(el) {
                super(el);
                this.state = { count: 0, multiplier: 2 };
            }
            mount() {
                testInstance = this;
            }
            stateChange(changes) {
                lastReceivedChanges = { ...changes };
            }
        }

        const el = document.createElement('div');
        el.setAttribute('data-component', 'FunctionalComp');
        document.body.appendChild(el);
        loadComponents({ FunctionalComp }, document.body);

        // Chain functional updaters in the same tick
        testInstance.setState((prev) => ({ count: prev.count + 1 }));
        testInstance.setState((prev) => ({ count: prev.count + 2 }));

        expect(testInstance.state.count).toBe(3);

        await new Promise((r) => setTimeout(r, 20));

        expect(lastReceivedChanges).toEqual({ count: 3 });
        expect(testInstance.state.count).toBe(3);
    });

    test('should safely ignore pending state updates if component unmounts in the same frame', async () => {
        let testInstance;
        let stateChangeCalled = false;

        class UnmountBeforeFlushComp extends BaseComponent {
            mount() {
                testInstance = this;
            }
            stateChange() {
                stateChangeCalled = true;
            }
        }

        const el = document.createElement('div');
        el.setAttribute('data-component', 'UnmountBeforeFlushComp');
        document.body.appendChild(el);
        loadComponents({ UnmountBeforeFlushComp }, document.body);

        // Queue a state change
        testInstance.setState({ active: true });

        // Immediately destroy instance before RAF flushes
        testInstance._destroy();

        await new Promise((r) => setTimeout(r, 20));

        expect(stateChangeCalled).toBe(false);
    });


    test('should remove a mirrored data-* attribute when the state value is no longer a primitive', async () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        class Box extends BaseComponent {}
        const box = new Box(el);
        box._load();
        const frame = () => new Promise((r) => setTimeout(r, 20));

        box.setState({ count: 5, label: 'a', open: true });
        await frame();
        expect(el.getAttribute('data-count')).toBe('5');
        expect(el.getAttribute('data-open')).toBe('true');

        box.setState({ count: null, label: { text: 'a' }, open: undefined });
        await frame();
        expect(el.hasAttribute('data-count')).toBe(false);
        expect(el.hasAttribute('data-label')).toBe(false);
        expect(el.hasAttribute('data-open')).toBe(false);

        // Back to a primitive: mirrored again
        box.setState({ count: 0 });
        await frame();
        expect(el.getAttribute('data-count')).toBe('0');
    });

    test('should not remove markup attributes for state that was never a mirrored primitive', async () => {
        const el = document.createElement('div');
        el.setAttribute('data-items', 'from-markup');
        document.body.appendChild(el);
        class List extends BaseComponent {}
        const list = new List(el);
        list._load();

        list.setState({ items: [1, 2, 3] });
        await new Promise((r) => setTimeout(r, 20));

        expect(el.getAttribute('data-items')).toBe('from-markup');
    });

    test('should keep the attribute when a value changes to null and back within one batch', async () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        let changes = 0;
        class Box extends BaseComponent {
            stateChange() { changes++; }
        }
        const box = new Box(el);
        box._load();
        const frame = () => new Promise((r) => setTimeout(r, 20));

        box.setState({ count: 5 });
        await frame();
        box.setState({ count: null });
        box.setState({ count: 5 });
        await frame();

        expect(el.getAttribute('data-count')).toBe('5');
        expect(changes).toBe(1); // the reverted batch reports nothing
    });


    test('should never mirror state onto attributes Gia reads itself', async () => {
        const el = document.createElement('div');
        el.setAttribute('data-component', 'Widget');
        document.body.appendChild(el);
        let received = null;
        class Widget extends BaseComponent {
            stateChange(changes) { received = changes; }
        }
        const widget = new Widget(el);
        widget._load();

        const originalWarn = console.warn;
        const warnings = [];
        console.warn = (msg) => warnings.push(msg);
        try {
            widget.setState({ component: 'Other', ref: 'r', options: 'o', action: 'click->x', mount: 'idle', count: 1 });
            widget.setState({ component: 'Again' }); // same key: no second warning
            await new Promise((r) => setTimeout(r, 20));
        } finally {
            console.warn = originalWarn;
        }

        expect(el.getAttribute('data-component')).toBe('Widget');
        for (const name of ['ref', 'options', 'action', 'mount']) {
            expect(el.hasAttribute(`data-${name}`)).toBe(false);
        }
        expect(el.getAttribute('data-count')).toBe('1');
        // Still regular state, reported to stateChange()
        expect(widget.state.component).toBe('Again');
        expect(received).toMatchObject({ component: 'Again', mount: 'idle', count: 1 });
        expect(warnings.filter((w) => w.includes('"component"')).length).toBeLessThanOrEqual(1);
    });


    test('should hand stateChange() a payload object the component may keep', async () => {
        const el = document.createElement('div');
        document.body.appendChild(el);
        const payloads = [];
        class Keeper extends BaseComponent {
            stateChange(changes) { payloads.push(changes); }
        }
        const keeper = new Keeper(el);
        keeper._load();
        const frame = () => new Promise((r) => setTimeout(r, 20));

        keeper.setState({ step: 1 });
        await frame();
        keeper.setState({ step: 2, done: true });
        await frame();

        expect(payloads).toEqual([{ step: 1 }, { step: 2, done: true }]);
        expect(payloads[0]).not.toBe(payloads[1]);
    });
});
