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
