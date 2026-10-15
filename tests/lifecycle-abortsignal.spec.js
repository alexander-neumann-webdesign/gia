import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import Component from '../src/Component.js';
import createInstance from '../src/createInstance.js';
import destroyInstance from '../src/destroyInstance.js';
import loadComponents from '../src/loadComponents.js';
import removeComponents from '../src/removeComponents.js';
import config from '../src/config.js';

test.describe('Lifecycle Hooks & AbortSignal', () => {
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

    test('should lazily create this.signal and abort it on destruction', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);

        let abortFired = false;
        class TestComponent extends BaseComponent {
            mount() {
                expect(this.signal).toBeDefined();
                expect(this.signal.aborted).toBe(false);
                this.signal.addEventListener('abort', () => {
                    abortFired = true;
                });
            }
        }

        const instance = createInstance(el, 'TestComponent', TestComponent);
        instance._load();

        expect(instance.isMounted).toBe(true);
        expect(abortFired).toBe(false);

        destroyInstance(el);

        expect(instance.isMounted).toBe(false);
        expect(abortFired).toBe(true);
        expect(instance.signal.aborted).toBe(true);
    });

    test('should automatically remove event listeners attached with this.signal on unmount', () => {
        const el = document.createElement('div');
        const btn = document.createElement('button');
        el.appendChild(btn);
        document.body.appendChild(el);

        let clickCount = 0;
        class TestComponent extends BaseComponent {
            mount() {
                btn.addEventListener('click', () => {
                    clickCount++;
                }, { signal: this.signal });
            }
        }

        const instance = createInstance(el, 'TestComponent', TestComponent);
        instance._load();

        btn.dispatchEvent(new Event('click'));
        expect(clickCount).toBe(1);

        destroyInstance(el);

        // Click again after unmount - listener should have been aborted
        btn.dispatchEvent(new Event('click'));
        expect(clickCount).toBe(1);
    });

    test('should execute mount cleanup function returned from mount()', () => {
        const el = document.createElement('div');
        document.body.appendChild(el);

        let cleanupCalled = false;
        class TestComponent extends BaseComponent {
            mount() {
                return () => {
                    cleanupCalled = true;
                };
            }
        }

        const instance = createInstance(el, 'TestComponent', TestComponent);
        instance._load();

        expect(cleanupCalled).toBe(false);

        destroyInstance(el);

        expect(cleanupCalled).toBe(true);
    });

    test('should not run mount() if destroyed before async require() completes', async () => {
        const el = document.createElement('div');
        document.body.appendChild(el);

        let mountCalled = false;
        let resolveRequire;
        const requirePromise = new Promise((resolve) => {
            resolveRequire = resolve;
        });

        class AsyncComponent extends Component {
            require() {
                return requirePromise;
            }
            mount() {
                mountCalled = true;
            }
        }

        const instance = createInstance(el, 'AsyncComponent', AsyncComponent);
        instance._load();

        expect(instance.isMounted).toBe(false);
        expect(mountCalled).toBe(false);

        // Destroy component while require is still in-flight
        destroyInstance(el);
        expect(instance.signal.aborted).toBe(true);

        // Now resolve require
        resolveRequire();
        await requirePromise;

        // Give any microtasks a chance to run
        await new Promise((r) => setTimeout(r, 10));

        expect(mountCalled).toBe(false);
        expect(instance.isMounted).toBe(false);
    });

    test('should ignore setState() if component has unmounted', async () => {
        const el = document.createElement('div');
        document.body.appendChild(el);

        let stateChangeCalled = false;
        class TestComponent extends BaseComponent {
            mount() {}
            stateChange() {
                stateChangeCalled = true;
            }
        }

        const instance = createInstance(el, 'TestComponent', TestComponent);
        instance._load();

        destroyInstance(el);

        // Calling setState after destruction should be silently ignored
        instance.setState({ foo: 'bar' });

        await new Promise((r) => setTimeout(r, 20));
        expect(stateChangeCalled).toBe(false);
    });

    test('should automatically clean up data-action listeners via signal', () => {
        config.set('autoBindActions', true);

        const el = document.createElement('div');
        el.setAttribute('data-component', 'ActionComponent');
        const btn = document.createElement('button');
        btn.setAttribute('data-action', 'click->handleClick');
        el.appendChild(btn);
        document.body.appendChild(el);

        let actionCount = 0;
        class ActionComponent extends BaseComponent {
            handleClick() {
                actionCount++;
            }
        }

        loadComponents({ ActionComponent }, document.body);

        btn.dispatchEvent(new Event('click'));
        expect(actionCount).toBe(1);

        destroyInstance(el);

        btn.dispatchEvent(new Event('click'));
        expect(actionCount).toBe(1);
    });

    test('removeComponents should unmount the context element itself when context has data-component', () => {
        const root = document.createElement('div');
        root.setAttribute('data-component', 'RootComponent');
        const child = document.createElement('div');
        child.setAttribute('data-component', 'ChildComponent');
        root.appendChild(child);
        document.body.appendChild(root);

        let rootUnmounted = false;
        let childUnmounted = false;

        class RootComponent extends BaseComponent {
            unmount() {
                rootUnmounted = true;
            }
        }

        class ChildComponent extends BaseComponent {
            unmount() {
                childUnmounted = true;
            }
        }

        loadComponents({ RootComponent, ChildComponent }, root);

        // Call removeComponents directly with the root element as context
        removeComponents(root);

        expect(childUnmounted).toBe(true);
        expect(rootUnmounted).toBe(true);
    });

    test('Component._load should handle promise rejection in require() without crashing or unhandled rejection', async () => {
        const el = document.createElement('div');
        document.body.appendChild(el);

        let mountCalled = false;
        const originalError = console.error;
        let loggedError = null;
        console.error = (msg, err) => {
            loggedError = { msg, err };
        };

        try {
            class FailingComponent extends Component {
                async require() {
                    throw new Error('Network asset failed to load');
                }
                mount() {
                    mountCalled = true;
                }
            }

            const instance = createInstance(el, 'FailingComponent', FailingComponent);
            instance._load();

            await new Promise((r) => setTimeout(r, 20));

            expect(mountCalled).toBe(false);
            expect(instance.isMounted).toBe(false);
            expect(loggedError).not.toBeNull();
            expect(loggedError.msg).toContain('Error loading dependencies for "FailingComponent"');
        } finally {
            console.error = originalError;
        }
    });
});
