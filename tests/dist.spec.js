import { test, expect } from '@playwright/test';
import * as fullDist from '../dist/gia.full.mjs';
import * as miniDist from '../dist/gia.mini.mjs';
import * as nanoDist from '../dist/gia.nano.mjs';
import { JSDOM } from 'jsdom';

test.describe('Distribution Bundle Exports & Runtime Verification', () => {
    let dom;
    let window;

    test.beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body><div data-component="TestBox"></div></body></html>', {
            url: 'http://localhost/'
        });
        window = dom.window;
        window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
        window.cancelAnimationFrame = (id) => clearTimeout(id);
        global.window = window;
        global.document = window.document;
        global.Element = window.Element;
        global.Node = window.Node;
        global.requestAnimationFrame = window.requestAnimationFrame;
        global.cancelAnimationFrame = window.cancelAnimationFrame;
    });

    test.afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Element;
        delete global.Node;
        delete global.requestAnimationFrame;
        delete global.cancelAnimationFrame;
    });

    test('gia.full.mjs should export all core, component, utility, and scheduler APIs', () => {
        expect(typeof fullDist.loadComponents).toBe('function');
        expect(typeof fullDist.createInstance).toBe('function');
        expect(typeof fullDist.removeComponents).toBe('function');
        expect(typeof fullDist.destroyInstance).toBe('function');
        expect(typeof fullDist.getComponentFromElement).toBe('function');
        expect(typeof fullDist.Component).toBe('function');
        expect(typeof fullDist.BaseComponent).toBe('function');
        expect(typeof fullDist.register).toBe('function');
        expect(typeof fullDist.eventbus).toBe('object');
        expect(typeof fullDist.config).toBe('object');
        expect(typeof fullDist.utils).toBe('object');
        expect(typeof fullDist.measure).toBe('function');
        expect(typeof fullDist.mutate).toBe('function');
        expect(typeof fullDist.clear).toBe('function');
    });

    test('gia.mini.mjs should export expected APIs without autoMount', () => {
        expect(typeof miniDist.loadComponents).toBe('function');
        expect(typeof miniDist.Component).toBe('function');
        expect(typeof miniDist.BaseComponent).toBe('function');
        expect(typeof miniDist.register).toBe('function');
        expect(typeof miniDist.eventbus).toBe('object');
        expect(typeof miniDist.utils).toBe('object');
    });

    test('gia.nano.mjs should export minimal subset without Component or eventbus', () => {
        expect(typeof nanoDist.loadComponents).toBe('function');
        expect(typeof nanoDist.BaseComponent).toBe('function');
        expect(typeof nanoDist.register).toBe('function');
        expect(typeof nanoDist.utils).toBe('object');
        expect(typeof nanoDist.measure).toBe('function');
        expect(typeof nanoDist.mutate).toBe('function');
        // nano does not export Component or eventbus
        expect(nanoDist.Component).toBeUndefined();
        expect(nanoDist.eventbus).toBeUndefined();
    });

    test('should successfully instantiate and mount a component using full dist', () => {
        let mounted = false;

        class TestBox extends fullDist.BaseComponent {
            mount() {
                mounted = true;
            }
        }

        const el = window.document.querySelector('[data-component="TestBox"]');
        fullDist.loadComponents({ TestBox }, window.document.body);

        expect(mounted).toBe(true);
        const instance = fullDist.getComponentFromElement(el);
        expect(instance).toBeInstanceOf(TestBox);
        expect(instance.isMounted).toBe(true);
    });

    test('should successfully instantiate and mount a component using mini dist with observers intact', async () => {
        let mounted = false;

        class MiniBox extends miniDist.Component {
            mount() {
                mounted = true;
            }
        }

        const container = window.document.createElement('div');
        container.innerHTML = '<div data-component="MiniBox"></div>';
        window.document.body.appendChild(container);
        const el = container.firstElementChild;

        miniDist.loadComponents({ MiniBox }, container);
        await Promise.resolve();

        expect(mounted).toBe(true);
        const instance = miniDist.getComponentFromElement(el);
        expect(instance).toBeInstanceOf(MiniBox);
        expect(instance.isMounted).toBe(true);
        expect(typeof instance.observeScroll).toBe('function');
        expect(typeof instance.observeIntersection).toBe('function');
        expect(typeof instance.observeResize).toBe('function');
        expect(typeof instance.observeWindowResize).toBe('function');
        expect(typeof instance.observeMediaQuery).toBe('function');
    });

    test('should preserve window.__gia_scheduler__ without mangling collision', () => {
        // Scheduler should be attached to window without property mangling distortion
        fullDist.measure(() => {});
        expect(window.__gia_scheduler__).toBeDefined();
        expect(Array.isArray(window.__gia_scheduler__.reads)).toBe(true);
    });

    test('should share window.__gia_store__ across dist bundles to prevent double-mounting', () => {
        class SharedBox extends fullDist.BaseComponent {
            mount() {}
        }

        const el = window.document.querySelector('[data-component="TestBox"]');
        fullDist.loadComponents({ TestBox: SharedBox }, window.document.body);

        // Instance should be recognized by nanoDist through shared window.__gia_store__
        const nanoFound = nanoDist.getComponentFromElement(el);
        expect(nanoFound).toBeInstanceOf(SharedBox);

        // Calling nanoDist.createInstance on the already mounted element returns existing instance
        const duplicate = nanoDist.createInstance(el, 'TestBox', SharedBox);
        expect(duplicate).toBe(nanoFound);
    });

    test('loadComponents() should automatically mount registered components when called without arguments', () => {
        let mounted = false;
        class AutoRegisteredBox extends fullDist.BaseComponent {
            mount() {
                mounted = true;
            }
        }

        fullDist.register(AutoRegisteredBox);
        const container = window.document.createElement('div');
        container.setAttribute('data-component', 'AutoRegisteredBox');
        window.document.body.appendChild(container);

        fullDist.loadComponents(); // No arguments!
        expect(mounted).toBe(true);

        const instance = fullDist.getComponentFromElement(container);
        expect(instance).toBeInstanceOf(AutoRegisteredBox);
    });

    test('loadComponents(context) should mount registered components on specified container', () => {
        let mounted = false;
        class ContextBox extends fullDist.BaseComponent {
            mount() {
                mounted = true;
            }
        }

        fullDist.register(ContextBox);
        const container = window.document.createElement('div');
        container.innerHTML = '<div data-component="ContextBox"></div>';
        window.document.body.appendChild(container);

        fullDist.loadComponents(container); // Single argument (context)!
        expect(mounted).toBe(true);

        const instance = fullDist.getComponentFromElement(container.firstElementChild);
        expect(instance).toBeInstanceOf(ContextBox);
    });

    test('removeComponents should defensively handle 2 arguments (components, context)', () => {
        let unmounted = false;
        class DefBox extends fullDist.BaseComponent {
            unmount() {
                unmounted = true;
            }
        }

        const container = window.document.createElement('div');
        container.innerHTML = '<div data-component="DefBox"></div>';
        window.document.body.appendChild(container);

        fullDist.loadComponents({ DefBox }, container);
        const el = container.firstElementChild;
        expect(fullDist.getComponentFromElement(el)).toBeInstanceOf(DefBox);

        // Accidental 2-argument call: removeComponents({ DefBox }, container)
        expect(() => {
            fullDist.removeComponents({ DefBox }, container);
        }).not.toThrow();

        expect(unmounted).toBe(true);
        expect(fullDist.getComponentFromElement(el)).toBeNull();
    });

    test('UMD builds with extend: true should merge onto window.gia without destroying full APIs', async () => {
        const fs = await import('fs');
        const path = await import('path');

        const fullUmdCode = fs.readFileSync(path.resolve(process.cwd(), 'dist/gia.full.umd.js'), 'utf-8');
        const nanoUmdCode = fs.readFileSync(path.resolve(process.cwd(), 'dist/gia.nano.umd.js'), 'utf-8');

        const testWindow = dom.window;
        const runUmdInBrowser = (code, win) => {
            new Function('window', 'document', 'self', 'globalThis', `
                const exports = undefined;
                const module = undefined;
                ${code}
            `)(win, win.document, win, win);
        };

        runUmdInBrowser(fullUmdCode, testWindow);

        expect(typeof testWindow.gia.Component).toBe('function');
        expect(typeof testWindow.gia.eventbus).toBe('object');
        expect(typeof testWindow.gia.register).toBe('function');

        // Now evaluate nano build on the same window
        runUmdInBrowser(nanoUmdCode, testWindow);

        // Crucial idempotency check: Component and eventbus MUST still be defined!
        expect(typeof testWindow.gia.Component).toBe('function');
        expect(typeof testWindow.gia.eventbus).toBe('object');
        expect(typeof testWindow.gia.BaseComponent).toBe('function');
        expect(typeof testWindow.gia.register).toBe('function');
    });

    test('should share globalThis.__gia_eventbus__ across dist bundles for seamless cross-bundle communication', () => {
        let received = null;

        fullDist.eventbus.on('microfrontend-event', (data) => {
            received = data;
        });

        miniDist.eventbus.emit('microfrontend-event', { payload: 42 });

        expect(received).toEqual(expect.objectContaining({ payload: 42 }));
    });

    test('miniDist UMD should provide working MiniEventBus (emit, on, once, off, channel, signal)', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const miniUmdCode = fs.readFileSync(path.resolve(process.cwd(), 'dist/gia.mini.umd.js'), 'utf-8');

        const isolatedDom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        const win = isolatedDom.window;
        new Function('window', 'document', 'self', 'globalThis', `
            const exports = undefined;
            const module = undefined;
            ${miniUmdCode}
        `)(win, win.document, win, win);

        const eb = win.gia.eventbus;
        expect(eb).toBeDefined();

        // 1. emit & on
        let count = 0;
        let lastData = null;
        const handler = (data) => {
            count++;
            lastData = data;
        };
        eb.on('foo', handler);
        eb.emit('foo', { val: 123 });
        expect(count).toBe(1);
        expect(lastData).toEqual({ val: 123, _name: 'foo' });

        // 2. off
        eb.off('foo', handler);
        eb.emit('foo', { val: 456 });
        expect(count).toBe(1);

        // 3. once
        let onceCount = 0;
        eb.once('single', () => {
            onceCount++;
        });
        eb.emit('single');
        eb.emit('single');
        expect(onceCount).toBe(1);

        // 4. signal abort
        const ac = new AbortController();
        let abortCount = 0;
        eb.on('abortable', () => {
            abortCount++;
        }, { signal: ac.signal });
        eb.emit('abortable');
        expect(abortCount).toBe(1);
        ac.abort();
        eb.emit('abortable');
        expect(abortCount).toBe(1);

        // 5. channel
        const ch = eb.channel('user');
        let chCount = 0;
        const chHandler = () => { chCount++; };
        ch.on('login', chHandler);
        ch.emit('login');
        expect(chCount).toBe(1);
        ch.off('login', chHandler);
        ch.emit('login');
        expect(chCount).toBe(1);
    });

    test('loadComponents should defer to DOMContentLoaded when document.readyState is loading', () => {
        let mounted = false;
        class DeferBox extends fullDist.BaseComponent {
            mount() {
                mounted = true;
            }
        }

        // Simulate document still loading (e.g. script executed in <head>)
        Object.defineProperty(window.document, 'readyState', {
            value: 'loading',
            configurable: true
        });

        fullDist.register(DeferBox);
        const container = window.document.createElement('div');
        container.setAttribute('data-component', 'DeferBox');
        window.document.body.appendChild(container);

        fullDist.loadComponents();
        expect(mounted).toBe(false); // Not mounted yet while loading!

        // Simulate DOMContentLoaded event
        Object.defineProperty(window.document, 'readyState', {
            value: 'interactive',
            configurable: true
        });
        window.document.dispatchEvent(new window.Event('DOMContentLoaded'));

        expect(mounted).toBe(true); // Mounted automatically when DOMContentLoaded fired!
    });

    test('loadComponents should auto-discover components from window[name] if not registered', () => {
        let mounted = false;
        class GlobalWindowBox extends fullDist.BaseComponent {
            mount() {
                mounted = true;
            }
        }

        // Attached to window directly, as in regular <script> tags
        window.GlobalWindowBox = GlobalWindowBox;

        const container = window.document.createElement('div');
        container.setAttribute('data-component', 'GlobalWindowBox');
        window.document.body.appendChild(container);

        // Call loadComponents with no registration or args
        fullDist.loadComponents();

        expect(mounted).toBe(true);
        const instance = fullDist.getComponentFromElement(container);
        expect(instance).toBeInstanceOf(GlobalWindowBox);
    });

    test('UMD script tag with data-auto-mount should automatically mount registered components', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const fullUmdCode = fs.readFileSync(path.resolve(process.cwd(), 'dist/gia.full.umd.js'), 'utf-8');

        let mounted = false;
        const testWindow = dom.window;

        // Create script with data-auto-mount
        const scriptEl = testWindow.document.createElement('script');
        scriptEl.src = 'gia.full.umd.js';
        scriptEl.setAttribute('data-auto-mount', '');
        Object.defineProperty(testWindow.document, 'currentScript', {
            value: scriptEl,
            configurable: true
        });

        // Create DOM element
        const container = testWindow.document.createElement('div');
        container.setAttribute('data-component', 'AutoMountTestComp');
        testWindow.document.body.appendChild(container);

        // Define component globally
        class AutoMountTestComp extends fullDist.BaseComponent {
            mount() {
                mounted = true;
            }
        }
        testWindow.AutoMountTestComp = AutoMountTestComp;

        // Evaluate UMD code
        new Function('window', 'document', 'self', 'globalThis', `
            const exports = undefined;
            const module = undefined;
            ${fullUmdCode}
        `)(testWindow, testWindow.document, testWindow, testWindow);

        expect(mounted).toBe(true);
    });
});


