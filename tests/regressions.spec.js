import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import Component from '../src/Component.js';
import createInstance from '../src/createInstance.js';
import destroyInstance from '../src/destroyInstance.js';
import loadComponents from '../src/loadComponents.js';
import eventbus from '../src/eventbus.js';
import config from '../src/config.js';
import { components } from '../src/store.js';
import { mutate, measure, clear } from '../src/scheduler.js';
import { register } from '../src/registry.js';
import {
    observeScroll,
    unobserveScroll,
    observeResize,
    unobserveResize,
    observeIntersection,
    unobserveIntersection,
    observeMediaQuery,
    cleanupComponentObservers,
} from '../src/observers.js';

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

test.describe('Regression tests', () => {
    let window;
    let document;
    let saved;

    const mk = (html) => {
        const wrap = document.createElement('div');
        wrap.innerHTML = html;
        const el = wrap.firstElementChild;
        document.body.appendChild(el);
        return el;
    };

    test.beforeEach(() => {
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
        window = dom.window;
        document = window.document;
        saved = { AbortController: global.AbortController, AbortSignal: global.AbortSignal };

        global.window = window;
        global.document = document;
        global.Node = window.Node;
        global.CustomEvent = window.CustomEvent;
        global.Event = window.Event;
        global.AbortController = window.AbortController;
        global.AbortSignal = window.AbortSignal;
        window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
        global.requestAnimationFrame = window.requestAnimationFrame;
    });

    test.afterEach(() => {
        config.set('autoBindActions', false);
        delete global.window;
        delete global.document;
        delete global.Node;
        delete global.CustomEvent;
        delete global.Event;
        delete global.requestAnimationFrame;
        global.AbortController = saved.AbortController;
        global.AbortSignal = saved.AbortSignal;
    });

    test.describe('createInstance', () => {
        test('a constructor that throws does not leave a half-built instance in the store', () => {
            let attempts = 0;
            class Flaky extends BaseComponent {
                constructor(el) {
                    super(el);
                    attempts++;
                    if (attempts === 1) throw new Error('boom');
                }
            }

            const el = mk('<div data-component="Flaky"></div>');
            const origError = console.error;
            console.error = () => {};
            try {
                expect(createInstance(el, 'Flaky', Flaky)).toBe(null);
            } finally {
                console.error = origError;
            }

            expect(components.has(el)).toBe(false);

            // A later attempt must construct a fresh instance instead of returning the broken one
            const retry = createInstance(el, 'Flaky', Flaky);
            expect(retry).toBeInstanceOf(Flaky);
            expect(attempts).toBe(2);
            destroyInstance(el);
        });

        test('a failed constructor releases listeners bound through this.signal', () => {
            let clicks = 0;
            class Bad extends BaseComponent {
                constructor(el) {
                    super(el);
                    this.listen('click', () => clicks++);
                    throw new Error('boom');
                }
            }

            const el = mk('<div></div>');
            const origError = console.error;
            console.error = () => {};
            try {
                createInstance(el, 'Bad', Bad);
            } finally {
                console.error = origError;
            }

            el.click();
            expect(clicks).toBe(0);
        });
    });

    test.describe('auto-binding', () => {
        test('methods inherited from an intermediate class are bound to the instance', () => {
            class Base extends BaseComponent {
                whoAmI() {
                    return this && this.element;
                }
            }
            class Derived extends Base {
                own() {
                    return this && this.element;
                }
            }

            const el = mk('<div></div>');
            const instance = new Derived(el);
            const { whoAmI, own } = instance;
            expect(whoAmI()).toBe(el);
            expect(own()).toBe(el);
            instance._destroy();
        });

        test('subclass overrides win and Component internals are not bound', () => {
            class A extends Component {
                speak() {
                    return 'A';
                }
            }
            class B extends A {
                speak() {
                    return 'B:' + (this ? this.element.id : 'unbound');
                }
            }

            const el = mk('<div id="b"></div>');
            const instance = new B(el);
            const { speak } = instance;
            expect(speak()).toBe('B:b');
            expect(Object.prototype.hasOwnProperty.call(instance, 'require')).toBe(false);
            expect(Object.prototype.hasOwnProperty.call(instance, 'mount')).toBe(false);
            instance._destroy();
        });

        test('a getter overriding an inherited method is not invoked during binding', () => {
            let getterCalls = 0;
            class A extends BaseComponent {
                value() {
                    return 1;
                }
            }
            class B extends A {
                get value() {
                    getterCalls++;
                    return 2;
                }
            }

            const instance = new B(mk('<div></div>'));
            expect(getterCalls).toBe(0);
            expect(instance.value).toBe(2);
            instance._destroy();
        });

        test('data-action targeting an inherited method receives the component as this', () => {
            config.set('autoBindActions', true);
            let seen = null;
            class Base extends BaseComponent {
                handle() {
                    seen = this;
                }
            }
            class Derived extends Base {}

            const el = mk('<div><button data-action="click->handle"></button></div>');
            const instance = new Derived(el);
            el.querySelector('button').click();
            expect(seen).toBe(instance);
            instance._destroy();
        });
    });

    test.describe('this.on()', () => {
        test('boolean true shorthand registers a once listener', () => {
            class C extends BaseComponent {}
            const instance = new C(mk('<div></div>'));
            let calls = 0;
            instance.on('regression:once-bool', () => calls++, true);

            eventbus.emit('regression:once-bool');
            eventbus.emit('regression:once-bool');
            expect(calls).toBe(1);
            instance._destroy();
        });

        test('default (false) listener is persistent and removed on destroy', () => {
            class C extends BaseComponent {}
            const instance = new C(mk('<div></div>'));
            let calls = 0;
            instance.on('regression:persistent', () => calls++);

            eventbus.emit('regression:persistent');
            eventbus.emit('regression:persistent');
            expect(calls).toBe(2);

            instance._destroy();
            eventbus.emit('regression:persistent');
            expect(calls).toBe(2);
        });
    });

    test.describe('debounced / throttled actions', () => {
        test('a pending .debounce call does not fire after destroy', async () => {
            config.set('autoBindActions', true);
            let fired = 0;
            class D extends BaseComponent {
                go() {
                    fired++;
                }
            }

            const el = mk('<div><button data-action="click.debounce.20->go"></button></div>');
            new D(el);
            el.querySelector('button').click();
            destroyInstance(el);

            await tick(50);
            expect(fired).toBe(0);
        });

        test('a pending trailing .throttle call does not fire after destroy', async () => {
            config.set('autoBindActions', true);
            let fired = 0;
            class T extends BaseComponent {
                go() {
                    fired++;
                }
            }

            const el = mk('<div><button data-action="click.throttle.20->go"></button></div>');
            new T(el);
            const btn = el.querySelector('button');
            btn.click(); // leading call runs immediately
            btn.click(); // schedules the trailing call
            expect(fired).toBe(1);
            destroyInstance(el);

            await tick(50);
            expect(fired).toBe(1);
        });

        test('debounced action still fires while the component is alive', async () => {
            config.set('autoBindActions', true);
            let fired = 0;
            class D extends BaseComponent {
                go() {
                    fired++;
                }
            }

            const el = mk('<div><button data-action="click.debounce.10->go"></button></div>');
            new D(el);
            el.querySelector('button').click();
            await tick(40);
            expect(fired).toBe(1);
            destroyInstance(el);
        });
    });

    test.describe('updateRefs() without a schema', () => {
        test('picks up added and removed ref elements', () => {
            class R extends BaseComponent {
                constructor(el) {
                    super(el);
                    this.ref = {};
                }
            }

            const el = mk('<div><span data-ref="item"></span><b data-ref="gone"></b></div>');
            const instance = new R(el);
            expect(instance.ref.item.length).toBe(1);
            expect(instance.ref.gone.length).toBe(1);

            el.insertAdjacentHTML('beforeend', '<span data-ref="item"></span>');
            el.querySelector('[data-ref="gone"]').remove();
            instance.updateRefs();

            expect(instance.ref.item.length).toBe(2);
            expect(instance.ref.gone).toBeUndefined();
            instance._destroy();
        });

        test('a component-prefixed ref wins over an unprefixed one regardless of DOM order', () => {
            class Pref extends BaseComponent {
                constructor(el) {
                    super(el);
                    this.ref = {};
                }
            }

            const el = mk(
                '<div><i data-ref="title" id="plain"></i><i data-ref="Pref:title" id="prefixed"></i></div>',
            );
            const instance = new Pref(el);
            expect(instance.ref.title.length).toBe(1);
            expect(instance.ref.title[0].id).toBe('prefixed');
            instance._destroy();
        });
    });

    test.describe('scheduler handles', () => {
        test('a stale handle from a finished task cannot cancel a later task', async () => {
            const ctx = {};
            let first = 0;
            let second = 0;

            const h1 = mutate(function () {
                first++;
            }, ctx);
            await tick();
            expect(first).toBe(1);

            const h2 = mutate(function () {
                second++;
            }, ctx);
            expect(h2).not.toBe(h1);

            expect(clear(h1)).toBe(false);
            await tick();
            expect(second).toBe(1);
        });

        test('clear() works with both the returned handle and the original function', async () => {
            const ctx = { n: 0 };
            function inc() {
                this.n++;
            }

            const handle = measure(inc, ctx);
            expect(clear(handle)).toBe(true);

            measure(inc, ctx);
            expect(clear(inc)).toBe(true);

            await tick();
            expect(ctx.n).toBe(0);
        });

        test('clear() with a non-function argument cancels nothing', async () => {
            let ran = 0;
            mutate(() => ran++);
            expect(clear(undefined)).toBe(false);
            expect(clear(null)).toBe(false);
            await tick();
            expect(ran).toBe(1);
        });
    });

    test.describe('this.listen() bookkeeping', () => {
        test('listeners covered by the component signal are not tracked manually', () => {
            class L extends BaseComponent {}
            const instance = new L(mk('<div></div>'));
            for (let i = 0; i < 100; i++) {
                const off = instance.listen('click', () => {});
                off();
            }
            expect(instance._activeListeners).toBe(null);
            instance._destroy();
        });

        test('a caller-supplied signal is tracked, removed on destroy, and untracked by the remover', () => {
            class L extends BaseComponent {}
            const el = mk('<div></div>');
            const instance = new L(el);
            const external = new window.AbortController();
            let a = 0;
            let b = 0;

            const offA = instance.listen(el, 'click', () => a++, { signal: external.signal });
            instance.listen(el, 'click', () => b++, { signal: external.signal });
            expect(instance._activeListeners.length).toBe(8);

            offA();
            expect(instance._activeListeners.length).toBe(4);

            el.click();
            expect([a, b]).toEqual([0, 1]);

            instance._destroy();
            el.click();
            expect([a, b]).toEqual([0, 1]);
        });

        test('without AbortController, listeners are tracked and removed on destroy', () => {
            delete global.AbortController;
            const origAC = window.AbortController;
            window.AbortController = undefined;
            try {
                class L extends BaseComponent {}
                const el = mk('<div></div>');
                const instance = new L(el);
                let a = 0;
                let b = 0;

                const offA = instance.listen('click', () => a++);
                instance.listen('click', () => b++, true);
                expect(instance._activeListeners.length).toBe(8);

                offA();
                expect(instance._activeListeners.length).toBe(4);

                instance._destroy();
                el.click();
                expect([a, b]).toEqual([0, 0]);
            } finally {
                window.AbortController = origAC;
            }
        });

        test('delegate() with once cleans up its bookkeeping after firing', () => {
            class D extends BaseComponent {}
            const el = mk('<div><a class="x"></a></div>');
            const instance = new D(el);
            const external = new window.AbortController();
            let calls = 0;

            instance.delegate('.x', 'click', () => calls++, { once: true, signal: external.signal });
            expect(instance._activeListeners.length).toBe(4);

            el.querySelector('.x').click();
            el.querySelector('.x').click();
            expect(calls).toBe(1);
            expect(instance._activeListeners.length).toBe(0);
            instance._destroy();
        });
    });

    test.describe('component name resolution from markup', () => {
        const silenceWarn = (fn) => {
            const orig = console.warn;
            console.warn = () => {};
            try {
                return fn();
            } finally {
                console.warn = orig;
            }
        };

        test('arbitrary window functions are never called', () => {
            const calls = [];
            window.siteGlobalFn = (el) => calls.push(['siteGlobalFn', el]);
            const realSetTimeout = window.setTimeout;
            window.setTimeout = function (arg) {
                calls.push(['setTimeout', arg]);
                return realSetTimeout.apply(this, arguments);
            };
            try {
                mk('<div data-component="siteGlobalFn"></div>');
                mk('<a data-component="setTimeout" href="mailto:alert(1)"></a>');
                silenceWarn(() => loadComponents(document.body));
                silenceWarn(() => loadComponents({ Unrelated: class {} }, document.body));
            } finally {
                window.setTimeout = realSetTimeout;
                delete window.siteGlobalFn;
            }
            expect(calls).toEqual([]);
        });

        test('non-Gia classes on window are not instantiated, even with a mount() method', () => {
            let constructed = 0;
            window.Splide = class {
                constructor() {
                    constructed++;
                }
                mount() {}
            };
            try {
                const el = mk('<div data-component="Splide"></div>');
                silenceWarn(() => loadComponents(document.body));
                expect(constructed).toBe(0);
                expect(components.has(el)).toBe(false);
            } finally {
                delete window.Splide;
            }
        });

        test('Gia component classes on window are still discovered and mounted', async () => {
            class WindowWidget extends Component {
                mount() {
                    this.mounted = true;
                }
            }
            class WindowBase extends BaseComponent {
                mount() {
                    this.mounted = true;
                }
            }
            window.WindowWidget = WindowWidget;
            window.WindowBase = WindowBase;
            try {
                const a = mk('<div data-component="WindowWidget"></div>');
                const b = mk('<div data-component="WindowBase"></div>');
                loadComponents(document.body);
                await tick(); // Component mounts after its async require() step
                expect(components.get(a)).toBeInstanceOf(WindowWidget);
                expect(components.get(a).mounted).toBe(true);
                expect(components.get(b).mounted).toBe(true);
                destroyInstance(a);
                destroyInstance(b);
            } finally {
                delete window.WindowWidget;
                delete window.WindowBase;
            }
        });

        test('names inherited from Object.prototype are not resolved from a registry', () => {
            let called = 0;
            Object.prototype.__giaProbe = () => called++;
            try {
                mk('<div data-component="__giaProbe"></div>');
                mk('<div data-component="constructor"></div>');
                silenceWarn(() => loadComponents({ Other: class extends BaseComponent {} }, document.body));
            } finally {
                delete Object.prototype.__giaProbe;
            }
            expect(called).toBe(0);
        });

        test('developer-supplied factories and lazy loaders keep working', async () => {
            class Lazy extends BaseComponent {
                mount() {
                    this.mounted = true;
                }
            }
            const lazyEl = mk('<div data-component="Lazy"></div>');
            const factoryEl = mk('<div data-component="Factory"></div>');
            loadComponents(
                {
                    Lazy: () => Promise.resolve({ default: Lazy }),
                    Factory: () => Lazy,
                },
                document.body,
            );
            await tick();
            expect(components.get(lazyEl).mounted).toBe(true);
            expect(components.get(factoryEl).mounted).toBe(true);
            destroyInstance(lazyEl);
            destroyInstance(factoryEl);
        });

        test('a throwing window getter does not abort mounting of other components', () => {
            Object.defineProperty(window, 'explodingGetter', {
                configurable: true,
                get() {
                    throw new Error('SecurityError');
                },
            });
            class Fine extends BaseComponent {
                mount() {
                    this.mounted = true;
                }
            }
            try {
                mk('<div data-component="explodingGetter"></div>');
                const el = mk('<div data-component="Fine"></div>');
                silenceWarn(() => loadComponents({ Fine }, document.body));
                expect(components.get(el).mounted).toBe(true);
                destroyInstance(el);
            } finally {
                delete window.explodingGetter;
            }
        });
    });

    test.describe('repeated loadComponents() calls never double-mount', () => {
        test('data-mount="idle" scheduled twice mounts once', async () => {
            let mounts = 0;
            class Idle extends BaseComponent {
                mount() {
                    mounts++;
                }
            }
            const el = mk('<div data-component="Idle" data-mount="idle"></div>');
            loadComponents({ Idle }, document.body);
            loadComponents({ Idle }, document.body);
            await tick(120); // setTimeout(50) fallback without requestIdleCallback
            expect(mounts).toBe(1);
            destroyInstance(el);
        });

        test('a deferred mount that finds the element detached can be retried later', async () => {
            let mounts = 0;
            class Idle extends BaseComponent {
                mount() {
                    mounts++;
                }
            }
            const el = mk('<div data-component="Idle" data-mount="idle"></div>');
            loadComponents({ Idle }, document.body);
            el.remove();
            await tick(120);
            expect(mounts).toBe(0);

            document.body.appendChild(el);
            loadComponents({ Idle }, document.body);
            await tick(120);
            expect(mounts).toBe(1);
            destroyInstance(el);
        });

        test('a pending lazy import() is not started twice and mounts once', async () => {
            let loaderCalls = 0;
            let mounts = 0;
            class Lazy extends BaseComponent {
                mount() {
                    mounts++;
                }
            }
            const registry = {
                Lazy: () => {
                    loaderCalls++;
                    return new Promise((resolve) => setTimeout(() => resolve({ default: Lazy }), 10));
                },
            };
            const el = mk('<div data-component="Lazy"></div>');
            loadComponents(registry, document.body);
            loadComponents(registry, document.body);
            await tick(40);
            expect(loaderCalls).toBe(1);
            expect(mounts).toBe(1);
            destroyInstance(el);
        });

        test('a failed lazy import() can be retried', async () => {
            let attempt = 0;
            class Lazy extends BaseComponent {
                mount() {
                    this.mounted = true;
                }
            }
            const registry = {
                Lazy: () => (++attempt === 1 ? Promise.reject(new Error('network')) : Promise.resolve({ default: Lazy })),
            };
            const el = mk('<div data-component="Lazy"></div>');
            const origError = console.error;
            console.error = () => {};
            try {
                loadComponents(registry, document.body);
                await tick();
            } finally {
                console.error = origError;
            }
            // The registry entry is still the loader, so a second pass retries it
            loadComponents(registry, document.body);
            await tick();
            expect(components.get(el).mounted).toBe(true);
            destroyInstance(el);
        });
    });

    test('a failed constructor tears down without calling unmount()', () => {
        let unmounts = 0;
        class Bad extends BaseComponent {
            constructor(el) {
                super(el);
                throw new Error('boom');
            }
            unmount() {
                unmounts++;
            }
        }
        const origError = console.error;
        console.error = () => {};
        try {
            createInstance(mk('<div></div>'), 'Bad', Bad);
        } finally {
            console.error = origError;
        }
        expect(unmounts).toBe(0);
    });

    test.describe('observers', () => {
        let ioInstances;
        let roInstance;

        class MockIO {
            constructor(cb, options) {
                this.cb = cb;
                this.options = options;
                this.targets = new Set();
                this.disconnected = false;
                ioInstances.push(this);
            }
            observe(el) {
                this.targets.add(el);
            }
            unobserve(el) {
                this.targets.delete(el);
            }
            disconnect() {
                this.disconnected = true;
                this.targets.clear();
            }
            fire(target, isIntersecting = true) {
                this.cb([{ target, isIntersecting }]);
            }
        }
        class MockRO {
            constructor(cb) {
                this.cb = cb;
                this.targets = new Set();
                roInstance = this;
            }
            observe(el) {
                this.targets.add(el);
            }
            unobserve(el) {
                this.targets.delete(el);
            }
            fire(target) {
                this.cb([{ target }]);
            }
        }

        test.beforeEach(() => {
            ioInstances = [];
            window.IntersectionObserver = MockIO;
            global.IntersectionObserver = MockIO;
            // The module keeps one shared ResizeObserver, created on first use (roInstance)
            window.ResizeObserver = MockRO;
            global.ResizeObserver = MockRO;
        });

        test.afterEach(() => {
            delete global.IntersectionObserver;
            delete global.ResizeObserver;
        });

        test('an emptied IntersectionObserver pool is released and recreated on reuse', () => {
            const comp = {};
            const el = document.createElement('div');
            const opts = { rootMargin: '13px', threshold: 0.25 };

            observeIntersection(comp, el, () => {}, opts);
            expect(ioInstances.length).toBe(1);
            unobserveIntersection(comp, el);
            expect(ioInstances[0].disconnected).toBe(true);

            let hits = 0;
            observeIntersection(comp, el, () => hits++, opts);
            expect(ioInstances.length).toBe(2); // fresh observer, not the disconnected one
            ioInstances[1].fire(el);
            expect(hits).toBe(1);
            cleanupComponentObservers(comp);
            expect(ioInstances[1].disconnected).toBe(true);
        });

        test('number and single-item array thresholds use separate observers', () => {
            const comp = {};
            const el = document.createElement('div');
            observeIntersection(comp, el, () => {}, { threshold: 0.5 });
            observeIntersection(comp, el, () => {}, { threshold: [0.5] });
            expect(ioInstances.length).toBe(2);
            cleanupComponentObservers(comp);
        });

        test('unobserveIntersection(instance, el) releases the element from every pooled observer', () => {
            const comp = {};
            const el = document.createElement('div');
            observeIntersection(comp, el, () => {}, { threshold: 0.1 });
            observeIntersection(comp, el, () => {}, { threshold: 0.9 });
            unobserveIntersection(comp, el);
            expect(ioInstances.map((o) => o.disconnected)).toEqual([true, true]);
        });

        test('a once intersection callback can be removed by its original function', () => {
            const comp = {};
            const el = document.createElement('div');
            let hits = 0;
            const cb = () => hits++;
            observeIntersection(comp, el, cb, { once: true, threshold: 0.33 });
            unobserveIntersection(comp, el, cb);
            expect(ioInstances[0].disconnected).toBe(true);
            ioInstances[0].fire(el);
            expect(hits).toBe(0);
        });

        test('two components on one element: destroying one keeps the other observing (IntersectionObserver)', () => {
            const a = {};
            const b = {};
            const el = document.createElement('div');
            let hitsA = 0;
            let hitsB = 0;
            observeIntersection(a, el, () => hitsA++, { threshold: 0.42 });
            observeIntersection(b, el, () => hitsB++, { threshold: 0.42 });

            cleanupComponentObservers(a);
            expect(ioInstances[0].disconnected).toBe(false);
            ioInstances[0].fire(el);
            expect([hitsA, hitsB]).toEqual([0, 1]);

            cleanupComponentObservers(b);
            expect(ioInstances[0].disconnected).toBe(true);
        });

        test('two components on one element: destroying one keeps the other observing (ResizeObserver)', () => {
            const a = {};
            const b = {};
            const el = document.createElement('div');
            let hitsA = 0;
            let hitsB = 0;
            observeResize(a, el, () => hitsA++);
            // The module creates one ResizeObserver for its lifetime. If another spec file in this
            // worker created it with a different mock, we cannot drive it from here.
            test.skip(!roInstance || !roInstance.targets.has(el), 'shared ResizeObserver owned by another spec file');
            observeResize(b, el, () => hitsB++);

            cleanupComponentObservers(a);
            expect(roInstance.targets.has(el)).toBe(true);
            roInstance.fire(el);
            expect([hitsA, hitsB]).toEqual([0, 1]);

            unobserveResize(b, el);
            expect(roInstance.targets.has(el)).toBe(false);
            cleanupComponentObservers(b);
        });

        test('a scroll callback that unobserves itself does not skip or repeat others', () => {
            const comp = {};
            const calls = [];
            const first = () => calls.push('first');
            const self = () => {
                calls.push('self');
                unobserveScroll(comp, self);
            };
            const last = () => calls.push('last');
            observeScroll(comp, first);
            observeScroll(comp, self);
            observeScroll(comp, last);

            window.dispatchEvent(new window.Event('scroll'));
            expect(calls.sort()).toEqual(['first', 'last', 'self']);

            calls.length = 0;
            window.dispatchEvent(new window.Event('scroll'));
            expect(calls.sort()).toEqual(['first', 'last']);
            cleanupComponentObservers(comp);
        });

        test('the window scroll listener is removed once the last callback is gone', () => {
            const added = [];
            const removed = [];
            const origAdd = window.addEventListener;
            const origRemove = window.removeEventListener;
            window.addEventListener = function (type, ...rest) {
                if (type === 'scroll') added.push(type);
                return origAdd.call(this, type, ...rest);
            };
            window.removeEventListener = function (type, ...rest) {
                if (type === 'scroll') removed.push(type);
                return origRemove.call(this, type, ...rest);
            };
            try {
                const a = {};
                const b = {};
                observeScroll(a, () => {});
                observeScroll(b, () => {});
                expect(added.length).toBe(1);
                cleanupComponentObservers(a);
                expect(removed.length).toBe(0);
                cleanupComponentObservers(b);
                expect(removed.length).toBe(1);
            } finally {
                window.addEventListener = origAdd;
                window.removeEventListener = origRemove;
            }
        });

        test('media query listeners are shared per query and removed with the last subscriber', () => {
            let listeners = 0;
            window.matchMedia = () => ({
                matches: true,
                addEventListener: () => listeners++,
                removeEventListener: () => listeners--,
            });
            const a = {};
            const b = {};
            const seen = [];
            observeMediaQuery(a, '(min-width: 1px)', (m) => seen.push(['a', m]));
            observeMediaQuery(b, '(min-width: 1px)', (m) => seen.push(['b', m]));
            expect(listeners).toBe(1);
            expect(seen).toEqual([['a', true], ['b', true]]);

            cleanupComponentObservers(a);
            expect(listeners).toBe(1);
            cleanupComponentObservers(b);
            expect(listeners).toBe(0);
        });
    });

    test.describe('state batching', () => {
        // stateChange() is only called on mounted instances
        const mounted = (Ctor, el) => {
            const instance = new Ctor(el);
            instance._load();
            return instance;
        };

        class S extends BaseComponent {
            constructor(el) {
                super(el);
                this.calls = [];
            }
            stateChange(changes) {
                this.calls.push({ ...changes });
            }
        }

        test('a key changed and changed back within one batch is not reported', async () => {
            const el = mk('<div></div>');
            const s = mounted(S, el);
            s.setState({ open: false, count: 1 });
            await tick();
            s.calls.length = 0;

            s.setState({ open: true, count: 2 });
            s.setState({ open: false }); // back to where the batch started
            await tick();
            expect(s.calls).toEqual([{ count: 2 }]);
            expect(el.getAttribute('data-open')).toBe('false');
            expect(el.getAttribute('data-count')).toBe('2');
            s._destroy();
        });

        test('a batch whose every change was reverted does not call stateChange at all', async () => {
            const el = mk('<div></div>');
            const s = mounted(S, el);
            s.setState({ step: 1 });
            await tick();
            s.calls.length = 0;

            s.setState({ step: 2 });
            s.setState({ step: 3 });
            s.setState({ step: 1 });
            await tick();
            expect(s.calls).toEqual([]);
            expect(el.getAttribute('data-step')).toBe('1');
            s._destroy();
        });

        test('reverting to an initially missing key is treated as no change', async () => {
            const s = mounted(S, mk('<div></div>'));
            s.setState({ temp: 'x' });
            s.setState({ temp: undefined });
            await tick();
            expect(s.calls).toEqual([]);
            s._destroy();
        });

        test('a primitive replaced by an object in the same batch does not write a stale attribute', async () => {
            const el = mk('<div></div>');
            const s = mounted(S, el);
            s.setState({ value: 'text' });
            s.setState({ value: { complex: true } });
            await tick();
            expect(el.hasAttribute('data-value')).toBe(false);
            expect(s.calls).toEqual([{ value: { complex: true } }]);
            s._destroy();
        });

        test('setState() inside stateChange() is delivered in the next batch, with attributes synced', async () => {
            const el = mk('<div></div>');
            const seen = [];
            class V extends BaseComponent {
                stateChange(changes) {
                    seen.push(Object.keys(changes).join(','));
                    if ('inView' in changes && this.state.inView) {
                        this.setState({ playing: true });
                    }
                }
            }
            const v = mounted(V, el);
            v.setState({ inView: true });
            await tick(40);
            expect(seen).toEqual(['inView', 'playing']);
            expect(el.getAttribute('data-playing')).toBe('true');
            v._destroy();
        });

        test('a stateChange() that always sets state runs once per frame instead of looping', async () => {
            const el = mk('<div></div>');
            let calls = 0;
            class Loop extends BaseComponent {
                stateChange() {
                    calls++;
                    this.setState({ n: calls });
                }
            }
            const l = mounted(Loop, el);
            l.setState({ n: 0 });
            await tick(5); // a single frame in the test's setTimeout-based requestAnimationFrame
            expect(calls).toBeGreaterThanOrEqual(1);
            expect(calls).toBeLessThan(10);
            l._destroy();
        });
    });

    test.describe('register()', () => {
        test('uses options.name over the class name', () => {
            class e extends BaseComponent {} // what a minifier leaves behind
            register(e, { name: 'Header' });
            expect(window.gia.components.Header).toBe(e);
            expect(window.gia.components.e).toBeUndefined();
        });

        test('logs an error for a name that looks minified, but still registers it', () => {
            const errors = [];
            const orig = console.error;
            console.error = (msg) => errors.push(String(msg));
            try {
                class Ue extends BaseComponent {}
                register(Ue);
                class Header extends BaseComponent {}
                register(Header);
                register(Ue, { name: 'Explicit' });
                expect(window.gia.components.Ue).toBe(Ue);
            } finally {
                console.error = orig;
            }
            expect(errors.length).toBe(1);
            expect(errors[0]).toContain('"Ue"');
            expect(errors[0]).toContain('{ name:');
        });

        test('a registered explicit name is found by loadComponents()', () => {
            class t extends BaseComponent {
                mount() {
                    this.mounted = true;
                }
            }
            register(t, { name: 'SiteHeader' });
            const el = mk('<div data-component="SiteHeader"></div>');
            loadComponents(document.body);
            expect(components.get(el).mounted).toBe(true);
            destroyInstance(el);
        });
    });

    test.describe('options from data-* attributes', () => {
        test('a string default keeps the attribute verbatim', () => {
            const el = mk('<div data-zip="007" data-label="true" data-code="1e3" data-delay="250" data-flag></div>');
            class O extends BaseComponent {
                constructor(e) {
                    super(e);
                    this.options = { zip: '', label: 'none', code: 'x', delay: 100, flag: false };
                }
            }
            const o = new O(el);
            expect(o.options).toEqual({ zip: '007', label: 'true', code: '1e3', delay: 250, flag: true });
            o._destroy();
        });

        test('non-string defaults keep the existing coercion', () => {
            const el = mk('<div data-a="42" data-b="false" data-c="hello" data-d="7"></div>');
            class O extends BaseComponent {
                constructor(e) {
                    super(e);
                    this.options = { a: 0, b: true, c: null, d: null };
                }
            }
            const o = new O(el);
            expect(o.options).toEqual({ a: 42, b: false, c: 'hello', d: 7 });
            o._destroy();
        });
    });

    test('loadComponents can retry a component whose first construction failed', () => {
        let attempts = 0;
        class Retry extends BaseComponent {
            constructor(el) {
                super(el);
                if (++attempts === 1) throw new Error('first try fails');
            }
            mount() {
                this.mounted = true;
            }
        }

        const el = mk('<div data-component="Retry"></div>');
        const origError = console.error;
        console.error = () => {};
        try {
            loadComponents({ Retry }, document.body);
        } finally {
            console.error = origError;
        }
        expect(components.has(el)).toBe(false);

        loadComponents({ Retry }, document.body);
        expect(components.get(el).mounted).toBe(true);
        destroyInstance(el);
    });
});
