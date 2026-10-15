import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import Component from '../src/Component.js';
import createInstance from '../src/createInstance.js';
import destroyInstance from '../src/destroyInstance.js';
import loadComponents from '../src/loadComponents.js';
import removeComponents from '../src/removeComponents.js';
import getComponentFromElement from '../src/getComponentFromElement.js';
import config from '../src/config.js';

test.describe('Component Features & Configuration (BaseComponent, config, actions, getComponentFromElement)', () => {
    let dom;
    let window;
    let document;
    let originalAbortController;
    let originalAbortSignal;

    test.beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost/'
        });
        window = dom.window;
        document = window.document;

        global.window = window;
        global.document = document;
        global.Node = window.Node;
        global.Element = window.Element;
        global.HTMLElement = window.HTMLElement;
        global.CustomEvent = window.CustomEvent;
        global.Event = window.Event;

        originalAbortController = global.AbortController;
        originalAbortSignal = global.AbortSignal;
        global.AbortController = window.AbortController;
        global.AbortSignal = window.AbortSignal;

        global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
        global.cancelAnimationFrame = (id) => clearTimeout(id);
    });

    test.afterEach(() => {
        config.set('attrPrefix', 'data');
        config.set('autoBindActions', false);
        config.set('log', false);

        delete global.window;
        delete global.document;
        delete global.Node;
        delete global.Element;
        delete global.HTMLElement;
        delete global.CustomEvent;
        delete global.Event;

        if (originalAbortController !== undefined) {
            global.AbortController = originalAbortController;
        } else {
            delete global.AbortController;
        }
        if (originalAbortSignal !== undefined) {
            global.AbortSignal = originalAbortSignal;
        } else {
            delete global.AbortSignal;
        }
        delete global.requestAnimationFrame;
        delete global.cancelAnimationFrame;
    });

    test.describe('BaseComponent options parsing and merging', () => {
        test('should parse JSON from data-options attribute and merge with component defaults', () => {
            const el = document.createElement('div');
            el.setAttribute('data-options', JSON.stringify({
                limit: 25,
                filter: 'active',
                nested: { enabled: true }
            }));
            document.body.appendChild(el);

            class OptionsComponent extends BaseComponent {
                mount() {
                    this.options = {
                        limit: 10,
                        filter: 'all',
                        sort: 'desc'
                    };
                }
            }

            const instance = createInstance(el, 'OptionsComponent', OptionsComponent);
            instance._load();

            expect(instance.options).toEqual({
                limit: 25, // Overridden by data-options
                filter: 'active', // Overridden by data-options
                sort: 'desc', // Kept from defaults
                nested: { enabled: true } // Added from data-options
            });

            destroyInstance(el);
        });

        test('should preserve constructor options and merge with defaults and attribute options', () => {
            const el = document.createElement('div');
            el.setAttribute('data-options', JSON.stringify({ attrOpt: 'from-attr' }));
            document.body.appendChild(el);

            class ConstructorOptComponent extends BaseComponent {
                mount() {
                    this.options = { defaultOpt: 'from-default' };
                }
            }

            const instance = createInstance(el, 'ConstructorOptComponent', ConstructorOptComponent, {
                ctorOpt: 'from-ctor'
            });
            instance._load();

            expect(instance.options).toEqual({
                ctorOpt: 'from-ctor',
                defaultOpt: 'from-default',
                attrOpt: 'from-attr'
            });

            destroyInstance(el);
        });

        test('should gracefully handle malformed JSON in data-options without crashing', () => {
            const el = document.createElement('div');
            el.setAttribute('data-options', '{ invalid JSON format: 123');
            document.body.appendChild(el);

            const errors = [];
            const originalError = console.error;
            console.error = (msg) => { errors.push(msg); };

            class MalformedOptComponent extends BaseComponent {
                mount() {
                    this.options = { fallback: true, count: 5 };
                }
            }

            const instance = createInstance(el, 'MalformedOptComponent', MalformedOptComponent);
            expect(() => instance._load()).not.toThrow();

            // Retains default options
            expect(instance.options).toEqual({ fallback: true, count: 5 });
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0]).toContain('Failed to parse options for component "MalformedOptComponent"');

            console.error = originalError;
            destroyInstance(el);
        });

        test('should ignore data-options strings that do not start with { or [', () => {
            const el = document.createElement('div');
            el.setAttribute('data-options', 'simple-plain-string');
            document.body.appendChild(el);

            const errors = [];
            const originalError = console.error;
            console.error = (msg) => { errors.push(msg); };

            class PlainStringOptComponent extends BaseComponent {
                mount() {
                    this.options = { safeDefault: 42 };
                }
            }

            const instance = createInstance(el, 'PlainStringOptComponent', PlainStringOptComponent);
            instance._load();

            expect(instance.options).toEqual({ safeDefault: 42 });
            expect(errors.length).toBe(0); // JSON.parse was skipped

            console.error = originalError;
            destroyInstance(el);
        });
    });

    test.describe('BaseComponent.getRef helper', () => {
        test('should return correct CSS selector for plain ref and prefixed ref', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            class RefHelperComponent extends BaseComponent {}
            const instance = createInstance(el, 'RefHelperComponent', RefHelperComponent);

            expect(instance.getRef('button')).toBe('[data-ref="button"]');
            expect(instance.getRef('button', true)).toBe('[data-ref="RefHelperComponent:button"]');

            destroyInstance(el);
        });

        test('should respect custom attrPrefix in getRef selector', () => {
            config.set('attrPrefix', 'gia');
            const el = document.createElement('div');
            document.body.appendChild(el);

            class CustomPrefixComponent extends BaseComponent {}
            const instance = createInstance(el, 'CustomPrefixComponent', CustomPrefixComponent);

            expect(instance.getRef('input')).toBe('[gia-ref="input"]');
            expect(instance.getRef('input', true)).toBe('[gia-ref="CustomPrefixComponent:input"]');

            destroyInstance(el);
        });
    });

    test.describe('getComponentFromElement utility', () => {
        test('should retrieve component instance by DOM element reference', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            class LookupComponent extends BaseComponent {}
            const instance = createInstance(el, 'LookupComponent', LookupComponent);

            const found = getComponentFromElement(el);
            expect(found).toBe(instance);

            destroyInstance(el);
        });

        test('should retrieve component instance by element ID string', () => {
            const el = document.createElement('div');
            el.id = 'unique-comp-id';
            document.body.appendChild(el);

            class IdLookupComponent extends BaseComponent {}
            const instance = createInstance(el, 'IdLookupComponent', IdLookupComponent);

            const found = getComponentFromElement('unique-comp-id');
            expect(found).toBe(instance);

            destroyInstance(el);
        });

        test('should return null when element does not exist or has no component mounted', () => {
            const notMountedEl = document.createElement('div');
            document.body.appendChild(notMountedEl);

            expect(getComponentFromElement('non-existent-id')).toBeNull();
            expect(getComponentFromElement(notMountedEl)).toBeNull();
        });
    });

    test.describe('Global Config & Custom attrPrefix Integration', () => {
        test('should mount and unmount components using custom attrPrefix across the framework', () => {
            config.set('attrPrefix', 'app');

            const container = document.createElement('div');
            container.innerHTML = `
                <div id="comp1" app-component="AppTestComponent">
                    <button app-ref="button">Click</button>
                </div>
            `;
            document.body.appendChild(container);

            let mounted = false;
            let unmounted = false;
            let capturedBtn = null;

            class AppTestComponent extends BaseComponent {
                mount() {
                    mounted = true;
                    this.ref = { button: null };
                    capturedBtn = this.ref.button;
                }
                unmount() {
                    unmounted = true;
                }
            }

            loadComponents({ AppTestComponent }, container);

            expect(mounted).toBe(true);
            const compEl = document.getElementById('comp1');
            const instance = getComponentFromElement(compEl);
            expect(instance).toBeInstanceOf(AppTestComponent);
            expect(capturedBtn).toBe(container.querySelector('[app-ref="button"]'));

            removeComponents(container);
            expect(unmounted).toBe(true);
            expect(getComponentFromElement(compEl)).toBeNull();
        });
    });

    test.describe('Data Actions (actions.js)', () => {
        test('should bind multiple space-separated actions on a single element and pass event with correct this', () => {
            config.set('autoBindActions', true);

            const el = document.createElement('div');
            el.setAttribute('data-component', 'ActionComponent');
            el.innerHTML = `
                <button data-action="click->onClick mouseenter->onHover focus->onFocus" id="action-btn">Action Button</button>
            `;
            document.body.appendChild(el);

            const events = [];

            class ActionComponent extends BaseComponent {
                onClick(e) {
                    events.push({ type: e.type, instance: this });
                }
                onHover(e) {
                    events.push({ type: e.type, instance: this });
                }
                onFocus(e) {
                    events.push({ type: e.type, instance: this });
                }
            }

            loadComponents({ ActionComponent }, document.body);

            const btn = document.getElementById('action-btn');
            btn.dispatchEvent(new window.Event('click'));
            btn.dispatchEvent(new window.Event('mouseenter'));
            btn.dispatchEvent(new window.Event('focus'));

            expect(events.length).toBe(3);
            expect(events[0].type).toBe('click');
            expect(events[0].instance).toBeInstanceOf(ActionComponent);
            expect(events[1].type).toBe('mouseenter');
            expect(events[2].type).toBe('focus');

            removeComponents(document.body);
        });

        test('should NOT bind private methods starting with underscore or excluded lifecycle methods', () => {
            config.set('autoBindActions', true);

            const el = document.createElement('div');
            el.setAttribute('data-component', 'RestrictedActionComponent');
            el.innerHTML = `
                <button data-action="click->_privateHandler click->mount click->unmount click->setState" id="btn-restricted">
                    Restricted
                </button>
            `;
            document.body.appendChild(el);

            let privateCalled = false;
            let mountCallCount = 0;

            class RestrictedActionComponent extends BaseComponent {
                mount() {
                    mountCallCount++;
                }
                _privateHandler() {
                    privateCalled = true;
                }
            }

            loadComponents({ RestrictedActionComponent }, document.body);
            expect(mountCallCount).toBe(1); // Normal initial mount

            const btn = document.getElementById('btn-restricted');
            btn.dispatchEvent(new window.Event('click'));

            expect(privateCalled).toBe(false);
            expect(mountCallCount).toBe(1); // mount was not attached as click handler

            removeComponents(document.body);
        });

        test('should log warning when target action method is not found on the component', () => {
            config.set('autoBindActions', true);

            const el = document.createElement('div');
            el.setAttribute('data-component', 'MissingActionComponent');
            el.innerHTML = `
                <button data-action="click->nonExistentMethod" id="btn-missing">Missing</button>
            `;
            document.body.appendChild(el);

            const warnings = [];
            const originalWarn = console.warn;
            console.warn = (msg) => { warnings.push(msg); };

            class MissingActionComponent extends BaseComponent {}

            expect(() => {
                loadComponents({ MissingActionComponent }, document.body);
            }).not.toThrow();

            expect(warnings.length).toBeGreaterThan(0);
            expect(warnings[0]).toContain('Method "nonExistentMethod" not found');

            console.warn = originalWarn;
            removeComponents(document.body);
        });

        test('should bind actions when using custom attrPrefix', () => {
            config.set('attrPrefix', 'custom');
            config.set('autoBindActions', true);

            const el = document.createElement('div');
            el.setAttribute('custom-component', 'CustomActionComponent');
            el.innerHTML = `
                <button custom-action="click->onCustomClick" id="custom-action-btn">Custom Action</button>
            `;
            document.body.appendChild(el);

            let clickHandled = false;

            class CustomActionComponent extends BaseComponent {
                onCustomClick() {
                    clickHandled = true;
                }
            }

            loadComponents({ CustomActionComponent }, document.body);

            const btn = document.getElementById('custom-action-btn');
            btn.dispatchEvent(new window.Event('click'));

            expect(clickHandled).toBe(true);

            removeComponents(document.body);
            config.set('attrPrefix', 'data');
        });
    });

    test.describe('Async Component (Component.js) Dynamic Loading', () => {
        test('should successfully mount and execute mount cleanup when require() resolves', async () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            let cleanupCalled = false;
            let mountCalled = false;

            class DynamicComponent extends Component {
                require() {
                    // Simulates dynamic import()
                    return Promise.resolve({ loadedLib: true });
                }
                mount() {
                    mountCalled = true;
                    return () => {
                        cleanupCalled = true;
                    };
                }
            }

            const instance = createInstance(el, 'DynamicComponent', DynamicComponent);
            instance._load();

            // Before resolution
            expect(instance.isMounted).toBe(false);

            // Wait for Promise microtasks
            await new Promise((r) => setTimeout(r, 10));

            expect(mountCalled).toBe(true);
            expect(instance.isMounted).toBe(true);
            expect(cleanupCalled).toBe(false);

            // Destroy should run mount cleanup
            destroyInstance(el);
            expect(instance.isMounted).toBe(false);
            expect(cleanupCalled).toBe(true);
        });

        test('should mount immediately and synchronously if require() returns non-promise or undefined', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            let mountCalled = false;

            class SyncRequireComponent extends Component {
                require() {
                    return null; // Non-promise
                }
                mount() {
                    mountCalled = true;
                }
            }

            const instance = createInstance(el, 'SyncRequireComponent', SyncRequireComponent);
            instance._load();

            expect(mountCalled).toBe(true);
            expect(instance.isMounted).toBe(true);

            destroyInstance(el);
        });

        test('this.listen should attach event listeners and auto-cleanup on unmount', () => {
            const el = document.createElement('div');
            const btn = document.createElement('button');
            el.appendChild(btn);
            document.body.appendChild(el);

            let elementClicks = 0;
            let buttonClicks = 0;
            let windowResizes = 0;

            class ListenerComponent extends BaseComponent {
                mount() {
                    // Test 2-arg: event on this.element
                    this.listen('click', () => {
                        elementClicks++;
                    });

                    // Test 3-arg: target element
                    this.listen(btn, 'click', () => {
                        buttonClicks++;
                    });

                    // Test 3-arg: window
                    this.listen(window, 'resize', () => {
                        windowResizes++;
                    });
                }
            }

            const instance = createInstance(el, 'ListenerComponent', ListenerComponent);
            instance._load();

            btn.click();
            expect(buttonClicks).toBe(1);
            expect(elementClicks).toBe(1); // bubbled to el

            window.dispatchEvent(new window.Event('resize'));
            expect(windowResizes).toBe(1);

            // Unmount component
            destroyInstance(el);

            // Clicks and events after unmount should NOT trigger callbacks
            btn.click();
            window.dispatchEvent(new window.Event('resize'));
            expect(buttonClicks).toBe(1);
            expect(elementClicks).toBe(1);
            expect(windowResizes).toBe(1);
        });

        test('config singleton should attach to globalThis.__gia_config__ for cross-bundle sharing', () => {
            expect(globalThis.__gia_config__).toBeDefined();
            expect(config).toBe(globalThis.__gia_config__);
        });

        test('loadComponents should be resilient if a component mount() throws an error', () => {
            document.body.innerHTML = `
                <div data-component="FailingComponent"></div>
                <div data-component="SucceedingComponent"></div>
            `;

            let succeedMounted = false;

            class FailingComponent extends BaseComponent {
                mount() {
                    throw new Error('Intentional crash in mount');
                }
            }

            class SucceedingComponent extends BaseComponent {
                mount() {
                    succeedMounted = true;
                }
            }

            // Suppress console.error during test
            const originalError = console.error;
            console.error = () => {};

            try {
                loadComponents({
                    FailingComponent,
                    SucceedingComponent,
                });

                expect(succeedMounted).toBe(true);
            } finally {
                console.error = originalError;
            }
        });

        test('loadComponents should support async dynamic import loaders (() => import(...))', async () => {
            document.body.innerHTML = `
                <div data-component="LazyComponent"></div>
            `;

            let lazyMounted = false;

            class LazyComponentClass extends BaseComponent {
                mount() {
                    lazyMounted = true;
                }
            }

            loadComponents({
                LazyComponent: () => Promise.resolve({ default: LazyComponentClass }),
            });

            expect(lazyMounted).toBe(false);

            // Wait for import resolution microtask
            await new Promise((r) => setTimeout(r, 20));

            expect(lazyMounted).toBe(true);
        });

        test('removeComponents should unmount children before parents in bottom-up order', () => {
            document.body.innerHTML = `
                <div id="parent" data-component="ParentComp">
                    <div id="child" data-component="ChildComp"></div>
                </div>
            `;

            const unmountOrder = [];

            class ParentComp extends BaseComponent {
                unmount() {
                    unmountOrder.push('parent');
                }
            }

            class ChildComp extends BaseComponent {
                unmount() {
                    unmountOrder.push('child');
                }
            }

            loadComponents({
                ParentComp,
                ChildComp,
            });

            removeComponents(document.getElementById('parent'));

            // Child must unmount before parent
            expect(unmountOrder).toEqual(['child', 'parent']);
        });

        test('data-action should bind on root element and support .prevent, .stop, and .once modifiers', () => {
            config.set('autoBindActions', true);

            document.body.innerHTML = `
                <button id="root-btn" data-component="ActionComp" data-action="click.prevent->handleRootClick">
                    <span id="child-span" data-action="click.stop->handleChildClick">Child</span>
                    <span id="once-span" data-action="click.once->handleOnceClick">Once</span>
                </button>
            `;

            let rootClicked = false;
            let rootDefaultPrevented = false;
            let childClicked = false;
            let onceClickCount = 0;

            class ActionComp extends BaseComponent {
                handleRootClick(e) {
                    rootClicked = true;
                    rootDefaultPrevented = e.defaultPrevented;
                }
                handleChildClick(e) {
                    childClicked = true;
                }
                handleOnceClick(e) {
                    onceClickCount++;
                }
            }

            loadComponents({ ActionComp });

            const rootBtn = document.getElementById('root-btn');
            const childSpan = document.getElementById('child-span');
            const onceSpan = document.getElementById('once-span');

            // Test root element action with .prevent
            const clickEvt = new window.Event('click', { cancelable: true, bubbles: true });
            rootBtn.dispatchEvent(clickEvt);
            expect(rootClicked).toBe(true);
            expect(rootDefaultPrevented).toBe(true);

            // Test child action with .stop (propagation stopped to root)
            rootClicked = false;
            const childClickEvt = new window.Event('click', { cancelable: true, bubbles: true });
            childSpan.dispatchEvent(childClickEvt);
            expect(childClicked).toBe(true);
            expect(rootClicked).toBe(false); // Propagation stopped

            // Test .once modifier
            onceSpan.click();
            onceSpan.click();
            expect(onceClickCount).toBe(1);

            destroyInstance(rootBtn);
        });

        test('this.emit and this.on should provide component-scoped eventbus with auto-cleanup', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            let receivedData = null;

            class EventComp extends BaseComponent {
                mount() {
                    this.on('custom-channel', (data) => {
                        receivedData = data;
                    });
                }
            }

            const instance = createInstance(el, 'EventComp', EventComp);
            instance._load();

            instance.emit('custom-channel', { hello: 'world' });
            expect(receivedData).toEqual({ hello: 'world', _name: 'custom-channel' });

            // Unmount component
            destroyInstance(el);

            // After unmount, listener should be detached
            receivedData = null;
            instance.emit('custom-channel', { hello: 'world again' });
            expect(receivedData).toBe(null);
        });

        test('getComponentFromElement and destroyInstance should support CSS selectors', () => {
            document.body.innerHTML = `
                <div id="target-comp" class="card-widget" data-component="SelectorComp"></div>
            `;

            class SelectorComp extends BaseComponent {}

            loadComponents({ SelectorComp });

            // ID with #
            const byIdHash = getComponentFromElement('#target-comp');
            expect(byIdHash).toBeInstanceOf(SelectorComp);

            // Class selector
            const byClass = getComponentFromElement('.card-widget');
            expect(byClass).toBe(byIdHash);

            // destroyInstance via selector
            destroyInstance('.card-widget');
            expect(getComponentFromElement('.card-widget')).toBe(null);
        });

        test('this.updateRefs() should refresh refs after dynamic innerHTML updates', () => {
            const el = document.createElement('div');
            el.innerHTML = `<span data-ref="label">Initial</span>`;
            document.body.appendChild(el);

            class DynamicRefComp extends BaseComponent {
                mount() {
                    this.ref = {
                        label: null,
                    };
                }
            }

            const instance = createInstance(el, 'DynamicRefComp', DynamicRefComp);
            instance._load();

            expect(instance.ref.label.textContent).toBe('Initial');

            // Dynamically replace DOM contents
            el.innerHTML = `<span data-ref="label">Updated</span>`;
            instance.updateRefs();

            expect(instance.ref.label.textContent).toBe('Updated');

            destroyInstance(el);
        });
    });
});
