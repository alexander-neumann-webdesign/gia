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
