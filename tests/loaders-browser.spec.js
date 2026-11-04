const { test, expect } = require('@playwright/test');
const path = require('path');

// Real-browser tests for loadScript/loadStyle: tag lookup (including WordPress' "-js"/"-css"
// suffixed IDs), tags that finished loading before the call, and tags still in flight.
// Assets are served from a fake origin via page.route so resource timing behaves as in production.
const ORIGIN = 'https://assets.test';
const dist = (file) => path.join(__dirname, '../dist', file);

async function serveAssets(page, { slowMs = 0 } = {}) {
    await page.route(`${ORIGIN}/**`, async (route) => {
        const url = new URL(route.request().url());
        const name = url.pathname.slice(1);
        if (name.startsWith('slow') && slowMs) await new Promise((r) => setTimeout(r, slowMs));
        if (name.endsWith('.css')) {
            return route.fulfill({ contentType: 'text/css', body: 'body { --loaded: 1; }' });
        }
        if (name.endsWith('.html')) {
            return route.fulfill({ contentType: 'text/html', body: page.__html });
        }
        const global = name.replace(/\W/g, '_');
        return route.fulfill({
            contentType: 'application/javascript',
            body: `window.${global} = (window.${global} || 0) + 1;`,
        });
    });
}

// Resolves to 'TIMEOUT' instead of hanging the test when a promise never settles
const withTimeout = `(p, ms = 1500) => Promise.race([p, new Promise((r) => setTimeout(() => r('TIMEOUT'), ms))])`;

// A real origin is required: setContent() documents have an opaque origin, for which Chromium
// records no resource timing entries (unlike any real site).
async function openPage(page, body, bundle = 'gia.full.umd.js') {
    await serveAssets(page, { slowMs: 400 });
    page.__html = `<!doctype html><html><head></head><body>${body}</body></html>`;
    await page.goto(`${ORIGIN}/page.html`, { waitUntil: 'load' });
    await page.addScriptTag({ path: dist(bundle) });
}

test.describe('loadScript / loadStyle in a real browser', () => {
    test('WordPress enqueued script and style are found by handle (+ "-js" / "-css")', async ({ page }) => {
        await openPage(
            page,
            `<script id="swiper-js" src="${ORIGIN}/swiper.js"></script>
             <link rel="stylesheet" id="swiper-css" href="${ORIGIN}/swiper.css">`,
        );
        const result = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            const proto = window.gia.BaseComponent.prototype;
            return {
                script: await withTimeout(proto.loadScript('swiper', 'swiper_js')),
                style: await withTimeout(proto.loadStyle('swiper')),
            };
        }, withTimeout);
        // Already loaded and executed once; resolves with the global instead of hanging
        expect(result).toEqual({ script: 1, style: true });
    });

    test('an already-loaded script without a globalName resolves instead of hanging', async ({ page }) => {
        await openPage(page, `<script id="plain" src="${ORIGIN}/plain.js"></script>`);
        const result = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            return withTimeout(window.gia.BaseComponent.prototype.loadScript('plain'));
        }, withTimeout);
        expect(result).toBe(true);
        // ...and it was not executed a second time
        expect(await page.evaluate(() => window.plain_js)).toBe(1);
    });

    test('an unrelated element with the bare ID does not hide the WordPress-suffixed script', async ({ page }) => {
        await openPage(
            page,
            `<div id="slider">markup that happens to share the handle</div>
             <script id="slider-js" src="${ORIGIN}/slider.js"></script>`,
        );
        const result = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            // No globalName: the lookup itself must pick the <script id="slider-js">, not the <div>
            return withTimeout(window.gia.BaseComponent.prototype.loadScript('slider'));
        }, withTimeout);
        expect(result).toBe(true);
    });

    test('a wrong-typed element with the exact ID and no suffixed tag is still rejected', async ({ page }) => {
        await openPage(page, `<div id="evil" data-src="${ORIGIN}/evil.js"></div>`);
        const message = await page.evaluate(() =>
            window.gia.BaseComponent.prototype.loadScript('evil').then(
                () => 'resolved',
                (e) => e.message,
            ),
        );
        expect(message).toBe("Element with ID 'evil' is not a valid script tag.");
    });

    test('data-src with a WordPress-suffixed ID is triggered and resolves after execution', async ({ page }) => {
        await openPage(page, `<script id="lazy-js" data-src="${ORIGIN}/lazy.js"></script>`);
        const result = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            return withTimeout(window.gia.BaseComponent.prototype.loadScript('lazy', 'lazy_js'));
        }, withTimeout);
        expect(result).toBe(1);
    });

    test('a script inserted after page load and still downloading is awaited, not resolved early', async ({ page }) => {
        await openPage(page, '');
        const result = await page.evaluate(async (args) => {
            const withTimeout = eval(args.wt);
            const s = document.createElement('script');
            s.id = 'slow';
            s.src = `${args.origin}/slow.js`;
            document.head.appendChild(s);
            const value = await withTimeout(window.gia.BaseComponent.prototype.loadScript('slow'), 3000);
            return { value, executedBeforeResolve: window.slow_js };
        }, { wt: withTimeout, origin: ORIGIN });
        expect(result).toEqual({ value: true, executedBeforeResolve: 1 });
    });

    test('a script that ran while the document was still loading resolves on window load', async ({ page }) => {
        await serveAssets(page, { slowMs: 300 });
        page.__html = `<!doctype html><html><head>
            <script id="early" src="${ORIGIN}/early.js"></script>
            <script src="${ORIGIN}/gia.umd.js"></script>
            <script>
                window.__state = document.readyState;
                window.__result = window.gia.BaseComponent.prototype.loadScript('early');
            </script>
            </head><body><img src="${ORIGIN}/slow-image.js"></body></html>`;
        await page.route(`${ORIGIN}/gia.umd.js`, (route) =>
            route.fulfill({ path: dist('gia.full.umd.js'), contentType: 'application/javascript' }),
        );
        await page.goto(`${ORIGIN}/page.html`);
        const result = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            return { state: window.__state, value: await withTimeout(window.__result) };
        }, withTimeout);
        expect(result).toEqual({ state: 'loading', value: true });
    });

    test('a handler the page set via onload is kept', async ({ page }) => {
        await openPage(page, `<script id="hooked" data-src="${ORIGIN}/hooked.js"></script>`);
        const result = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            document.getElementById('hooked').onload = () => {
                window.__pageOnload = true;
            };
            const value = await withTimeout(window.gia.BaseComponent.prototype.loadScript('hooked'));
            return { value, pageOnload: !!window.__pageOnload };
        }, withTimeout);
        expect(result).toEqual({ value: true, pageOnload: true });
    });

    test('two Gia bundles loading the same tag share one load and both resolve', async ({ page }) => {
        await openPage(page, `<script id="shared" data-src="${ORIGIN}/slow-shared.js"></script>`);
        // Full owns window.gia; capture Mini's own exports from the UMD staging global
        await page.evaluate(() => {
            Object.defineProperty(window, '__gia_umd__', {
                configurable: true,
                get() {
                    return window.__miniExports;
                },
                set(v) {
                    window.__miniExports = v;
                },
            });
        });
        await page.addScriptTag({ path: dist('gia.mini.umd.js') });
        const result = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            const full = window.gia.BaseComponent;
            const mini = window.__miniExports.BaseComponent;
            const a = full.prototype.loadScript('shared', 'slow_shared_js');
            const b = mini.prototype.loadScript('shared', 'slow_shared_js');
            return {
                differentBundles: full !== mini,
                a: await withTimeout(a, 3000),
                b: await withTimeout(b, 3000),
                samePromise: a === b,
            };
        }, withTimeout);
        expect(result).toEqual({ differentBundles: true, a: 1, b: 1, samePromise: true });
    });

    test('a failed load is not cached, so a later call can retry', async ({ page }) => {
        await openPage(page, '');
        await page.route(`${ORIGIN}/flaky.js`, (route) => route.abort());
        const first = await page.evaluate(() =>
            window.gia.BaseComponent.prototype.loadScript(`https://assets.test/flaky.js`).then(
                () => 'resolved',
                (e) => e.message,
            ),
        );
        expect(first).toBe('Failed to load script: https://assets.test/flaky.js');
        // The dead tag Gia created is gone, so a retry fetches again and succeeds
        expect(await page.evaluate(() => document.querySelectorAll('script[src$="flaky.js"]').length)).toBe(0);
        await page.unroute(`${ORIGIN}/flaky.js`);
        const retry = await page.evaluate(async (wt) => {
            const withTimeout = eval(wt);
            return withTimeout(window.gia.BaseComponent.prototype.loadScript('https://assets.test/flaky.js', 'flaky_js'));
        }, withTimeout);
        expect(retry).toBe(1);
    });
});
