import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import createInstance from '../src/createInstance.js';
import destroyInstance from '../src/destroyInstance.js';
import {
    observeScroll,
    unobserveScroll,
    observeWindowResize,
    unobserveWindowResize,
    observeResize,
    unobserveResize,
    observeIntersection,
    unobserveIntersection,
    cleanupComponentObservers,
} from '../src/observers.js';

test.describe('Centralized Observers Engine (observers.js)', () => {
    let dom;
    let window;
    let document;
    let originalAbortController;
    let originalAbortSignal;
    let mockIntersectionObservers = [];

    class MockResizeObserver {
        static instances = [];
        static getInstance() {
            return MockResizeObserver.instances[0] || null;
        }

        constructor(callback) {
            this.callback = callback;
            this.observedElements = [];
            MockResizeObserver.instances.push(this);
        }
        observe(element) {
            if (!this.observedElements.includes(element)) {
                this.observedElements.push(element);
            }
        }
        unobserve(element) {
            const idx = this.observedElements.indexOf(element);
            if (idx !== -1) {
                this.observedElements.splice(idx, 1);
            }
        }
        disconnect() {
            this.observedElements = [];
        }
        trigger(entries) {
            this.callback(entries);
        }
    }

    class MockIntersectionObserver {
        constructor(callback, options = {}) {
            this.callback = callback;
            this.options = options;
            this.observedElements = [];
            this.isDisconnected = false;
            mockIntersectionObservers.push(this);
        }
        observe(element) {
            this.observedElements.push(element);
        }
        unobserve(element) {
            const idx = this.observedElements.indexOf(element);
            if (idx !== -1) {
                this.observedElements.splice(idx, 1);
            }
        }
        disconnect() {
            this.isDisconnected = true;
            this.observedElements = [];
        }
        trigger(entries) {
            this.callback(entries);
        }
    }

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

        mockIntersectionObservers = [];
        window.ResizeObserver = MockResizeObserver;
        window.IntersectionObserver = MockIntersectionObserver;
        global.ResizeObserver = MockResizeObserver;
        global.IntersectionObserver = MockIntersectionObserver;

        global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
        global.cancelAnimationFrame = (id) => clearTimeout(id);
    });

    test.afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Node;
        delete global.Element;
        delete global.HTMLElement;
        delete global.CustomEvent;
        delete global.Event;
        delete global.ResizeObserver;
        delete global.IntersectionObserver;

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

    test.describe('Window Scroll Observation', () => {
        test('should notify registered callbacks with scroll position and velocity on window scroll', () => {
            const instance = { _observedScrollCallbacks: [] };
            let receivedPayload = null;
            let callCount = 0;

            const callback = (payload) => {
                callCount++;
                receivedPayload = { ...payload };
            };

            observeScroll(instance, callback);

            // Mock scroll property on window
            Object.defineProperty(window, 'scrollY', { value: 120, writable: true, configurable: true });
            window.dispatchEvent(new window.Event('scroll'));

            expect(callCount).toBe(1);
            expect(receivedPayload).toEqual({ scroll: 120, velocity: 0 });

            // Second scroll event
            window.scrollY = 250;
            window.dispatchEvent(new window.Event('scroll'));

            expect(callCount).toBe(2);
            expect(receivedPayload).toEqual({ scroll: 250, velocity: 0 });

            // Cleanup
            unobserveScroll(instance, callback);

            // Scroll after unobserve should not trigger callback
            window.scrollY = 400;
            window.dispatchEvent(new window.Event('scroll'));
            expect(callCount).toBe(2);
        });

        test('should deduplicate identical scroll callbacks for the same component', () => {
            const instance = { _observedScrollCallbacks: [] };
            let callCount = 0;
            const callback = () => { callCount++; };

            observeScroll(instance, callback);
            observeScroll(instance, callback); // Duplicate call

            window.dispatchEvent(new window.Event('scroll'));
            expect(callCount).toBe(1);

            unobserveScroll(instance, callback);
        });

        test('should integrate seamlessly with Lenis smooth scrolling if window.lenis is present', () => {
            let lenisHandler = null;
            window.lenis = {
                scroll: 420,
                velocity: 3.5,
                on: (event, fn) => {
                    if (event === 'scroll') lenisHandler = fn;
                },
                off: (event, fn) => {
                    if (event === 'scroll') lenisHandler = null;
                }
            };

            const instance = { _observedScrollCallbacks: [] };
            let receivedPayload = null;
            const callback = (payload) => {
                receivedPayload = { ...payload };
            };

            observeScroll(instance, callback);
            expect(typeof lenisHandler).toBe('function');

            // Trigger handler via lenis event - update scroll and velocity on lenis instance
            window.lenis.scroll = 550;
            window.lenis.velocity = 2.1;
            lenisHandler({ scroll: 550, velocity: 2.1 });
            expect(receivedPayload).toEqual({ scroll: 550, velocity: 2.1 });

            // Unobserve should detach from lenis
            unobserveScroll(instance, callback);
            expect(lenisHandler).toBe(null);
            delete window.lenis;
        });
    });

    test.describe('Window Resize Observation', () => {
        test('should notify callbacks with window width and height on resize', () => {
            const instance = { _observedWindowResizeCallbacks: [] };
            let receivedPayload = null;
            let callCount = 0;

            const callback = (payload) => {
                callCount++;
                receivedPayload = { ...payload };
            };

            observeWindowResize(instance, callback);

            window.innerWidth = 1280;
            window.innerHeight = 800;
            window.dispatchEvent(new window.Event('resize'));

            expect(callCount).toBe(1);
            expect(receivedPayload).toEqual({ width: 1280, height: 800 });

            // Cleanup
            unobserveWindowResize(instance, callback);

            window.innerWidth = 640;
            window.dispatchEvent(new window.Event('resize'));
            expect(callCount).toBe(1); // Not called after unobserve
        });

        test('should deduplicate identical window resize callbacks', () => {
            const instance = { _observedWindowResizeCallbacks: [] };
            let callCount = 0;
            const callback = () => { callCount++; };

            observeWindowResize(instance, callback);
            observeWindowResize(instance, callback);

            window.dispatchEvent(new window.Event('resize'));
            expect(callCount).toBe(1);

            unobserveWindowResize(instance, callback);
        });
    });

    test.describe('ResizeObserver Pooling', () => {
        test('should share a single ResizeObserver across multiple elements and components', () => {
            const comp1 = {};
            const comp2 = {};
            const el1 = document.createElement('div');
            const el2 = document.createElement('div');

            let entries1 = null;
            let entries2 = null;

            observeResize(comp1, el1, (arr) => { entries1 = arr; });
            observeResize(comp2, el2, (arr) => { entries2 = arr; });

            // Exactly 1 global ResizeObserver instance should have been created
            const globalObserver = MockResizeObserver.getInstance();
            expect(globalObserver).not.toBeNull();
            expect(globalObserver.observedElements).toContain(el1);
            expect(globalObserver.observedElements).toContain(el2);

            // Trigger resize specifically for el1
            const mockEntry1 = { target: el1, contentRect: { width: 300, height: 150 } };
            globalObserver.trigger([mockEntry1]);

            expect(entries1).toEqual([mockEntry1]);
            expect(entries2).toBeNull(); // el2 should not receive el1's entry

            // Now trigger for el2
            const mockEntry2 = { target: el2, contentRect: { width: 100, height: 50 } };
            globalObserver.trigger([mockEntry2]);

            expect(entries2).toEqual([mockEntry2]);

            // Unobserve el1
            unobserveResize(comp1, el1);
            expect(globalObserver.observedElements).not.toContain(el1);
            expect(globalObserver.observedElements).toContain(el2);

            // Unobserve el2
            unobserveResize(comp2, el2);
            expect(globalObserver.observedElements).not.toContain(el2);
        });

        test('should support multiple callbacks on the same element and allow unobserving a specific callback', () => {
            const comp = {};
            const el = document.createElement('div');

            let count1 = 0;
            let count2 = 0;
            const cb1 = () => { count1++; };
            const cb2 = () => { count2++; };

            observeResize(comp, el, cb1);
            observeResize(comp, el, cb2);

            const globalObserver = MockResizeObserver.getInstance();
            expect(globalObserver).not.toBeNull();
            globalObserver.trigger([{ target: el }]);

            expect(count1).toBe(1);
            expect(count2).toBe(1);

            // Unobserve only cb1
            unobserveResize(comp, el, cb1);

            globalObserver.trigger([{ target: el }]);
            expect(count1).toBe(1); // Unchanged
            expect(count2).toBe(2); // Still notified

            // Unobserve remaining
            unobserveResize(comp, el, cb2);
            expect(globalObserver.observedElements).not.toContain(el);
        });
    });

    test.describe('IntersectionObserver Pooling', () => {
        test('should pool and reuse IntersectionObserver for elements with identical options', () => {
            const comp1 = {};
            const comp2 = {};
            const el1 = document.createElement('div');
            const el2 = document.createElement('div');

            const sharedOptions = { rootMargin: '20px 0px', threshold: 0.5 };
            let entries1 = null;
            let entries2 = null;

            observeIntersection(comp1, el1, (arr) => { entries1 = arr; }, sharedOptions);
            observeIntersection(comp2, el2, (arr) => { entries2 = arr; }, sharedOptions);

            // Both should share the same IntersectionObserver
            expect(mockIntersectionObservers.length).toBe(1);
            const sharedObserver = mockIntersectionObservers[0];
            expect(sharedObserver.observedElements).toContain(el1);
            expect(sharedObserver.observedElements).toContain(el2);

            // Trigger intersection for el1
            const entry1 = { target: el1, isIntersecting: true };
            sharedObserver.trigger([entry1]);

            expect(entries1).toEqual([entry1]);
            expect(entries2).toBeNull();

            // Unobserve el1
            unobserveIntersection(comp1, el1);
            expect(sharedObserver.observedElements).not.toContain(el1);
            expect(sharedObserver.isDisconnected).toBe(false);

            // Unobserve el2 -> elementsCount drops to 0 -> disconnects observer
            unobserveIntersection(comp2, el2);
            expect(sharedObserver.isDisconnected).toBe(true);
        });

        test('should create separate observers for different options (margins, thresholds, arrays)', () => {
            const comp = {};
            const el1 = document.createElement('div');
            const el2 = document.createElement('div');
            const el3 = document.createElement('div');

            observeIntersection(comp, el1, () => {}, { threshold: 0.1 });
            observeIntersection(comp, el2, () => {}, { threshold: 0.9 });
            observeIntersection(comp, el3, () => {}, { threshold: [0, 0.5, 1.0] });

            // Each option variation produces its own observer
            expect(mockIntersectionObservers.length).toBe(3);

            // Cleanup
            unobserveIntersection(comp, el1);
            unobserveIntersection(comp, el2);
            unobserveIntersection(comp, el3);
        });
    });

    test.describe('Component Observer Lifecycle & Auto-Teardown', () => {
        test('should automatically unobserve all scroll, resize, and intersection observers on component destruction', () => {
            const container = document.createElement('div');
            const childTarget = document.createElement('div');
            container.appendChild(childTarget);
            document.body.appendChild(container);

            let scrollFired = 0;
            let resizeFired = 0;
            let observerResizeFired = 0;
            let intersectionFired = 0;

            class ObserverComponent extends BaseComponent {
                mount() {
                    this.observeScroll(() => { scrollFired++; });
                    this.observeWindowResize(() => { resizeFired++; });
                    this.observeResize(childTarget, () => { observerResizeFired++; });
                    this.observeIntersection(childTarget, () => { intersectionFired++; }, { threshold: 0.5 });
                }
            }

            const instance = createInstance(container, 'ObserverComponent', ObserverComponent);
            instance._load();

            expect(instance.isMounted).toBe(true);

            // Trigger all observers
            window.dispatchEvent(new window.Event('scroll'));
            window.dispatchEvent(new window.Event('resize'));
            MockResizeObserver.getInstance().trigger([{ target: childTarget }]);
            mockIntersectionObservers[0].trigger([{ target: childTarget }]);

            expect(scrollFired).toBe(1);
            expect(resizeFired).toBe(1);
            expect(observerResizeFired).toBe(1);
            expect(intersectionFired).toBe(1);

            // Destroy the component
            destroyInstance(container);
            expect(instance.isMounted).toBe(false);

            // Trigger all events again
            window.dispatchEvent(new window.Event('scroll'));
            window.dispatchEvent(new window.Event('resize'));
            if (MockResizeObserver.getInstance()) {
                MockResizeObserver.getInstance().trigger([{ target: childTarget }]);
            }
            if (mockIntersectionObservers[0]) {
                mockIntersectionObservers[0].trigger([{ target: childTarget }]);
            }

            // None of the counters should have incremented
            expect(scrollFired).toBe(1);
            expect(resizeFired).toBe(1);
            expect(observerResizeFired).toBe(1);
            expect(intersectionFired).toBe(1);
        });

        test('observeIntersection with once: true should auto-unobserve after intersecting once', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            let fired = 0;
            class OnceComp extends BaseComponent {
                mount() {
                    this.observeIntersection(el, () => {
                        fired++;
                    }, { threshold: 0.5, once: true });
                }
            }

            const instance = createInstance(el, 'OnceComp', OnceComp);
            instance._load();

            const obs = mockIntersectionObservers[mockIntersectionObservers.length - 1];
            expect(obs).toBeDefined();

            // First intersection
            obs.trigger([{ target: el, isIntersecting: true }]);
            expect(fired).toBe(1);

            // Element should have been unobserved
            expect(obs.observedElements.includes(el)).toBe(false);

            // Trigger again - should not increment
            obs.trigger([{ target: el, isIntersecting: true }]);
            expect(fired).toBe(1);

            destroyInstance(el);
        });

        test('observeMediaQuery should fire immediately and update on change with auto-cleanup', () => {
            const el = document.createElement('div');
            document.body.appendChild(el);

            let currentMatches = null;
            let changeListener = null;

            window.matchMedia = (query) => ({
                matches: query.includes('768'),
                addEventListener: (evt, fn) => { changeListener = fn; },
                removeEventListener: (evt, fn) => { changeListener = null; },
            });

            class MediaComp extends BaseComponent {
                mount() {
                    this.observeMediaQuery('(min-width: 768px)', (matches) => {
                        currentMatches = matches;
                    });
                }
            }

            const instance = createInstance(el, 'MediaComp', MediaComp);
            instance._load();

            // Initial immediate trigger
            expect(currentMatches).toBe(true);

            // Change event
            changeListener({ matches: false });
            expect(currentMatches).toBe(false);

            // Destroy instance - cleans up
            destroyInstance(el);
            expect(changeListener).toBe(null);
        });
    });
});
