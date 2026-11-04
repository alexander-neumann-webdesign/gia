import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import loadComponents from '../src/loadComponents.js';
import removeComponents from '../src/removeComponents.js';
import destroyInstance from '../src/destroyInstance.js';
import { components as store } from '../src/store.js';

test.describe('Deferred mounts (data-mount="visible"/"idle", lazy import())', () => {
    let window;
    let document;
    let observers;

    class MockIntersectionObserver {
        constructor(callback, options) {
            this.callback = callback;
            this.options = options;
            this.targets = new Set();
            this.disconnected = false;
            observers.push(this);
        }
        observe(el) { this.targets.add(el); }
        unobserve(el) { this.targets.delete(el); }
        disconnect() { this.disconnected = true; this.targets.clear(); }
        intersect(...els) {
            this.callback(els.map((target) => ({ target, isIntersecting: true })));
        }
    }

    const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
    const mk = (html) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = html;
        document.body.appendChild(wrap);
        return wrap;
    };

    test.beforeEach(() => {
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
        window = dom.window;
        document = window.document;
        observers = [];
        global.window = window;
        global.document = document;
        global.Node = window.Node;
        global.Element = window.Element;
        global.IntersectionObserver = MockIntersectionObserver;
    });

    test.afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Node;
        delete global.Element;
        delete global.IntersectionObserver;
    });

    test('all data-mount="visible" elements share one IntersectionObserver, released once all mounted', () => {
        let mounts = 0;
        class Card extends BaseComponent {
            mount() { mounts++; }
        }
        const wrap = mk('<div data-component="Card" data-mount="visible"></div>'.repeat(50));
        const els = Array.from(wrap.children);

        loadComponents({ Card }, wrap);

        expect(observers.length).toBe(1);
        expect(observers[0].options).toEqual({ rootMargin: '200px' });
        expect(observers[0].targets.size).toBe(50);
        expect(mounts).toBe(0);

        observers[0].intersect(els[0], els[1]);
        expect(mounts).toBe(2);
        expect(observers[0].targets.size).toBe(48);
        expect(observers[0].disconnected).toBe(false);

        observers[0].intersect(...els.slice(2));
        expect(mounts).toBe(50);
        expect(observers[0].disconnected).toBe(true);

        // A later visible element gets a fresh observer
        const late = mk('<div data-component="Card" data-mount="visible"></div>');
        loadComponents({ Card }, late);
        expect(observers.length).toBe(2);

        removeComponents(document.body);
    });

    test('an intersection reported twice for the same element mounts it once', () => {
        let mounts = 0;
        class Card extends BaseComponent {
            mount() { mounts++; }
        }
        const wrap = mk('<div data-component="Card" data-mount="visible"></div>');
        loadComponents({ Card }, wrap);
        const el = wrap.firstChild;

        observers[0].callback([
            { target: el, isIntersecting: true },
            { target: el, isIntersecting: true },
        ]);
        expect(mounts).toBe(1);
        removeComponents(wrap);
    });

    test('removeComponents() cancels a pending visible mount and releases the observer', () => {
        let mounts = 0;
        class Card extends BaseComponent {
            mount() { mounts++; }
        }
        const wrap = mk('<div data-component="Card" data-mount="visible"></div>');
        const el = wrap.firstChild;
        loadComponents({ Card }, wrap);
        const observer = observers[0];

        removeComponents(wrap);
        expect(observer.targets.has(el)).toBe(false);
        expect(observer.disconnected).toBe(true);

        observer.callback([{ target: el, isIntersecting: true }]); // late entry
        expect(mounts).toBe(0);

        // The element can be deferred again afterwards
        loadComponents({ Card }, wrap);
        observers[1].intersect(el);
        expect(mounts).toBe(1);
        removeComponents(wrap);
    });

    test('destroyInstance() cancels a pending idle mount', async () => {
        let mounts = 0;
        class Idle extends BaseComponent {
            mount() { mounts++; }
        }
        const wrap = mk('<div data-component="Idle" data-mount="idle"></div>');
        loadComponents({ Idle }, wrap);
        destroyInstance(wrap.firstChild);

        await tick(120); // setTimeout(50) fallback without requestIdleCallback
        expect(mounts).toBe(0);
        expect(store.has(wrap.firstChild)).toBe(false);
    });

    test('removeComponents() while a lazy import() is pending stops it from mounting', async () => {
        let mounts = 0;
        class Lazy extends BaseComponent {
            mount() { mounts++; }
        }
        const registry = {
            Lazy: () => new Promise((resolve) => setTimeout(() => resolve({ default: Lazy }), 10)),
        };
        const wrap = mk('<div data-component="Lazy"></div>');
        loadComponents(registry, wrap);
        removeComponents(wrap);

        await tick(40);
        expect(mounts).toBe(0);
        expect(store.has(wrap.firstChild)).toBe(false);
    });

    test('a failed lazy import() can be retried', async () => {
        let attempts = 0;
        let mounts = 0;
        class Lazy extends BaseComponent {
            mount() { mounts++; }
        }
        const originalError = console.error;
        console.error = () => {};
        try {
            const registry = {
                Lazy: () => {
                    attempts++;
                    return attempts === 1
                        ? Promise.reject(new Error('network'))
                        : Promise.resolve({ default: Lazy });
                },
            };
            const wrap = mk('<div data-component="Lazy"></div>');
            loadComponents(registry, wrap);
            await tick(10);
            expect(mounts).toBe(0);

            loadComponents(registry, wrap);
            await tick(10);
            expect(attempts).toBe(2);
            expect(mounts).toBe(1);
            removeComponents(wrap);
        } finally {
            console.error = originalError;
        }
    });
});
