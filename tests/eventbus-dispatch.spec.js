const { test, expect } = require('@playwright/test');
const path = require('path');

// Listener changes during an emit follow DOM event semantics in every bundle that has a bus:
// a listener removed before its turn is skipped, one added during an emit first runs on the next.
const dist = (file) => path.join(__dirname, '../dist', file);

for (const bundle of ['gia.full.umd.js', 'gia.mini.umd.js']) {
    test.describe(`${bundle}: changing listeners during an emit`, () => {
        test.beforeEach(async ({ page }) => {
            await page.setContent('<body></body>');
            await page.addScriptTag({ path: dist(bundle) });
        });

        test('a listener removed by an earlier one is skipped; the rest run once', async ({ page }) => {
            const calls = await page.evaluate(() => {
                const bus = window.gia.eventbus;
                const calls = [];
                const c = () => calls.push('c');
                const a = () => { calls.push('a'); bus.off('evt', c); };
                const b = () => { calls.push('b'); bus.off('evt', b); };
                bus.on('evt', a);
                bus.on('evt', b);
                bus.on('evt', c);
                bus.emit('evt');
                calls.push('|');
                bus.emit('evt');
                bus.off('evt');
                return calls;
            });
            expect(calls).toEqual(['a', 'b', '|', 'a']);
        });

        test('a listener added during an emit first runs on the next emit', async ({ page }) => {
            const calls = await page.evaluate(() => {
                const bus = window.gia.eventbus;
                const calls = [];
                const late = () => calls.push('late');
                bus.once('evt', () => { calls.push('first'); bus.on('evt', late); });
                bus.emit('evt');
                bus.emit('evt');
                bus.off('evt');
                return calls;
            });
            expect(calls).toEqual(['first', 'late']);
        });

        test('off(event) during an emit stops the remaining listeners', async ({ page }) => {
            const calls = await page.evaluate(() => {
                const bus = window.gia.eventbus;
                const calls = [];
                bus.on('evt', () => { calls.push('a'); bus.off('evt'); });
                bus.on('evt', () => calls.push('b'));
                bus.emit('evt');
                bus.emit('evt');
                return calls;
            });
            expect(calls).toEqual(['a']);
        });

        test('a nested emit of the same event sees removals made by the outer one', async ({ page }) => {
            const calls = await page.evaluate(() => {
                const bus = window.gia.eventbus;
                const calls = [];
                let nested = false;
                const b = () => calls.push('b');
                bus.on('evt', () => {
                    calls.push('a');
                    if (nested) return;
                    nested = true;
                    bus.off('evt', b);
                    bus.emit('evt');
                });
                bus.on('evt', b);
                bus.emit('evt');
                bus.off('evt');
                return calls;
            });
            expect(calls).toEqual(['a', 'a']);
        });

        test('a throwing listener leaves the bus consistent for later emits', async ({ page }) => {
            const result = await page.evaluate(() => {
                const bus = window.gia.eventbus;
                const calls = [];
                const b = () => calls.push('b');
                bus.on('evt', () => {
                    bus.off('evt', b);
                    throw new Error('boom');
                });
                bus.on('evt', b);
                let threw = false;
                try { bus.emit('evt'); } catch (_e) { threw = true; }
                // Removal must now be immediate (no emit in progress) and the hole compacted
                const c = () => calls.push('c');
                bus.on('other', c);
                bus.off('other', c);
                bus.emit('other');
                bus.off('evt');
                return { threw, calls };
            });
            expect(result).toEqual({ threw: true, calls: [] });
        });
    });
}

test('gia.full.umd.js: a once() wildcard listener fires once and plain emits keep working', async ({ page }) => {
    await page.setContent('<body></body>');
    await page.addScriptTag({ path: dist('gia.full.umd.js') });
    const calls = await page.evaluate(() => {
        const bus = window.gia.eventbus;
        const calls = [];
        bus.once('cart:*', (e) => calls.push('wild:' + e._name));
        bus.on('cart:add', (e) => calls.push(e._name));
        bus.emit('cart:add');
        bus.emit('cart:add');
        bus.off('cart:add');
        return calls;
    });
    expect(calls).toEqual(['cart:add', 'wild:cart:add', 'cart:add']);
});
