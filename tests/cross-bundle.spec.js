const { test, expect } = require('@playwright/test');
const path = require('path');

// Several Gia bundles on one page (host + embedded widgets, micro-frontends) share the instance
// store, scheduler, config and event bus. Internal property names are mangled differently per
// build, so these tests load two real UMD bundles side by side and exercise every place where one
// bundle operates on objects created by the other.
const dist = (file) => path.join(__dirname, '../dist', file);
const builds = ['gia.full.umd.js', 'gia.mini.umd.js', 'gia.nano.umd.js'];

// Loads `first`, snapshots its exports as window.__first, then loads `second` (window.gia).
async function loadPair(page, first, second) {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent('<body></body>');
    await page.addScriptTag({ path: dist(first) });
    await page.evaluate(() => {
        window.__first = Object.assign({}, window.gia);
    });
    await page.addScriptTag({ path: dist(second) });
    return errors;
}

for (const first of builds) {
    for (const second of builds) {
        if (first === second) continue;

        test(`${first} component mounted and destroyed by ${second}`, async ({ page }) => {
            const errors = await loadPair(page, first, second);
            const result = await page.evaluate(async () => {
                const out = { mounts: 0, unmounts: 0, pings: 0 };
                class Widget extends window.__first.BaseComponent {
                    mount() {
                        out.mounts++;
                        this.listen(window, 'ping', () => out.pings++);
                    }
                    unmount() {
                        out.unmounts++;
                    }
                }
                const el = document.createElement('div');
                el.setAttribute('data-component', 'Widget');
                document.body.appendChild(el);

                // Mount through the second bundle, twice: must stay a single instance
                window.gia.loadComponents({ Widget });
                window.gia.loadComponents({ Widget });
                window.dispatchEvent(new Event('ping'));
                out.instanceIsWidget = window.gia.getComponentFromElement(el) instanceof Widget;

                // Tear down through the second bundle: unmount runs and this.signal listeners go away
                window.gia.removeComponents(document.body);
                window.dispatchEvent(new Event('ping'));
                out.storedAfterRemove = !!window.__first.getComponentFromElement(el);
                return out;
            });

            expect(errors).toEqual([]);
            expect(result).toEqual({
                mounts: 1,
                unmounts: 1,
                pings: 1,
                instanceIsWidget: true,
                storedAfterRemove: false,
            });
        });
    }
}

test('a constructor failure in a class from another bundle leaves no half-built instance', async ({ page }) => {
    const errors = await loadPair(page, 'gia.full.umd.js', 'gia.mini.umd.js');
    const result = await page.evaluate(() => {
        let attempts = 0;
        class Flaky extends window.__first.BaseComponent {
            constructor(el) {
                super(el);
                if (++attempts === 1) throw new Error('first attempt fails');
            }
            mount() {
                this.element.setAttribute('data-ok', 'yes');
            }
        }
        const el = document.createElement('div');
        el.setAttribute('data-component', 'Flaky');
        document.body.appendChild(el);
        const origError = console.error;
        console.error = () => {};
        window.gia.loadComponents({ Flaky });
        console.error = origError;
        const storedAfterFailure = !!window.gia.getComponentFromElement(el);
        window.gia.loadComponents({ Flaky });
        return { storedAfterFailure, mountedOnRetry: el.getAttribute('data-ok') };
    });
    expect(errors).toEqual([]);
    expect(result).toEqual({ storedAfterFailure: false, mountedOnRetry: 'yes' });
});

test.describe('shared event bus', () => {
    test('full loaded after mini upgrades the shared bus: wildcards work from both sides', async ({ page }) => {
        await loadPair(page, 'gia.mini.umd.js', 'gia.full.umd.js');
        const result = await page.evaluate(() => {
            const hits = [];
            // Registered before and after the upgrade, through either bundle's reference
            window.__first.eventbus.on('cart:*', (e) => hits.push('mini:' + e._name));
            window.gia.eventbus.on('*', (e) => hits.push('full:' + e._name));
            window.__first.eventbus.emit('cart:add');
            window.gia.eventbus.emit('cart:remove');
            return { sameBus: window.__first.eventbus === window.gia.eventbus, hits };
        });
        expect(result.sameBus).toBe(true);
        expect(result.hits).toEqual(['mini:cart:add', 'full:cart:add', 'mini:cart:remove', 'full:cart:remove']);
    });

    test('listeners registered on the mini bus before the upgrade survive it', async ({ page }) => {
        await page.setContent('<body></body>');
        await page.addScriptTag({ path: dist('gia.mini.umd.js') });
        await page.evaluate(() => {
            window.__calls = { plain: 0, once: 0, wildcard: 0, removable: 0 };
            const bus = window.gia.eventbus;
            bus.on('evt', () => window.__calls.plain++);
            bus.once('evt', () => window.__calls.once++);
            window.__removable = () => window.__calls.removable++;
            bus.once('evt', window.__removable);
            // Mini does not dispatch wildcards itself, but must keep them for the upgrade
            bus.on('ns:*', () => window.__calls.wildcard++);
        });
        await page.addScriptTag({ path: dist('gia.full.umd.js') });
        const calls = await page.evaluate(() => {
            const bus = window.gia.eventbus;
            bus.off('evt', window.__removable); // once-wrapper created by mini must be found by full
            bus.emit('evt');
            bus.emit('evt');
            bus.emit('ns:thing');
            return window.__calls;
        });
        expect(calls).toEqual({ plain: 2, once: 1, wildcard: 1, removable: 0 });
    });

    test('mini loaded after full reuses the full bus', async ({ page }) => {
        await loadPair(page, 'gia.full.umd.js', 'gia.mini.umd.js');
        const hits = await page.evaluate(() => {
            let n = 0;
            window.gia.eventbus.on('a:*', () => n++);
            window.__first.eventbus.emit('a:b');
            return n;
        });
        expect(hits).toBe(1);
    });
});

test.describe('UMD export merging on window.gia (most capable bundle wins)', () => {
    const rank = { 'gia.full.umd.js': 3, 'gia.mini.umd.js': 2, 'gia.nano.umd.js': 1 };

    // Loads a UMD file and returns a handle to the exports IT produced, by intercepting the
    // staging global the factory writes to before the merge footer moves them onto window.gia.
    async function loadCapturing(page, file, label) {
        await page.evaluate((label) => {
            Object.defineProperty(window, '__gia_umd__', {
                configurable: true,
                get() {
                    return window['__exports_' + label];
                },
                set(v) {
                    window['__exports_' + label] = v;
                },
            });
        }, label);
        await page.addScriptTag({ path: dist(file) });
        expect(await page.evaluate(() => '__gia_umd__' in window)).toBe(false); // staging cleaned up
    }

    for (const first of builds) {
        for (const second of builds) {
            const winner = rank[second] > rank[first] ? 'second' : 'first';

            test(`${first} then ${second}: exports come from the ${winner} bundle`, async ({ page }) => {
                await page.setContent('<body></body>');
                await loadCapturing(page, first, 'first');
                await page.evaluate(() => {
                    window.gia.register(class Registered extends window.gia.BaseComponent {});
                });
                await loadCapturing(page, second, 'second');

                const result = await page.evaluate((winner) => {
                    const won = window['__exports_' + winner];
                    const keys = ['loadComponents', 'removeComponents', 'createInstance', 'BaseComponent'];
                    return {
                        fromWinner: keys.filter((k) => window.gia[k] !== won[k]),
                        // Exports only one of the two provides (nano has no Component/eventbus) are filled in
                        hasComponent: typeof window.gia.Component,
                        registeredKept: typeof window.gia.components.Registered,
                    };
                }, winner);

                expect(result.fromWinner).toEqual([]);
                expect(result.registeredKept).toBe('function');
                const providesComponent = first !== 'gia.nano.umd.js' || second !== 'gia.nano.umd.js';
                expect(result.hasComponent).toBe(providesComponent ? 'function' : 'undefined');
            });
        }
    }

    test('a mini widget loaded after the full host does not break the host\'s lazy loaders', async ({ page }) => {
        await page.setContent('<div data-component="LazyThing"></div>');
        await page.addScriptTag({ path: dist('gia.full.umd.js') });
        await page.addScriptTag({ path: dist('gia.mini.umd.js') });
        const mounted = await page.evaluate(async () => {
            class LazyThing extends window.gia.BaseComponent {
                mount() {
                    this.element.setAttribute('data-mounted', 'yes');
                }
            }
            window.gia.loadComponents({ LazyThing: () => Promise.resolve({ default: LazyThing }) });
            await new Promise((r) => setTimeout(r, 20));
            return document.querySelector('[data-component="LazyThing"]').getAttribute('data-mounted');
        });
        expect(mounted).toBe('yes');
    });

    test('loading the full build after a nano widget upgrades window.gia', async ({ page }) => {
        await page.setContent('<body></body>');
        await page.addScriptTag({ path: dist('gia.nano.umd.js') });
        expect(await page.evaluate(() => typeof window.gia.eventbus)).toBe('undefined');
        await page.addScriptTag({ path: dist('gia.full.umd.js') });
        expect(await page.evaluate(() => typeof window.gia.eventbus)).toBe('object');
        expect(await page.evaluate(() => typeof window.gia.Component)).toBe('function');
    });
});

test('two full bundles on one page share a single auto-mount observer', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setContent('<body></body>');
    await page.evaluate(() => {
        const live = new Set();
        window.__liveObservers = live;
        const Native = window.MutationObserver;
        window.MutationObserver = class extends Native {
            observe(target, options) {
                // Count Gia's auto-mount observers only (Playwright injects observers of its own)
                if (options && options.attributeFilter && options.attributeFilter.includes('data-component')) {
                    live.add(this);
                }
                return super.observe(target, options);
            }
            disconnect() { live.delete(this); return super.disconnect(); }
        };
    });
    await page.addScriptTag({ path: dist('gia.full.umd.js') });
    await page.evaluate(async () => {
        window.gia.config.set('autoMountComponents', true);
        await new Promise((r) => setTimeout(r, 20));
    });
    // A second bundle (e.g. an embedded widget) arrives while auto-mount is already on
    await page.addScriptTag({ path: dist('gia.full.umd.js') });

    const result = await page.evaluate(async () => {
        const wait = () => new Promise((r) => setTimeout(r, 20));
        await wait(); // the second bundle starts its observer check on a timeout
        let mounts = 0;
        window.gia.register(class Widget extends window.gia.BaseComponent {
            mount() { mounts++; }
        });
        const whileOn = window.__liveObservers.size;

        const el = document.createElement('div');
        el.setAttribute('data-component', 'Widget');
        document.body.appendChild(el);
        await wait();

        window.gia.config.set('autoMountComponents', false);
        await wait();
        return { whileOn, mounts, afterOff: window.__liveObservers.size };
    });

    expect(errors).toEqual([]);
    expect(result).toEqual({ whileOn: 1, mounts: 1, afterOff: 0 });
});
