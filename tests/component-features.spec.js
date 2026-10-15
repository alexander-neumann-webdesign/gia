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
    });
});
