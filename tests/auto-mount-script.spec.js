const { test, expect } = require('@playwright/test');
const path = require('path');

// data-auto-mount must come from the <script> tag that loaded this Gia bundle. ES modules have no
// document.currentScript, so they must not pick up the attribute from some other script.
const ORIGIN = 'http://gia.test';

async function serve(page, html) {
    await page.route(`${ORIGIN}/**`, (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === '/') {
            return route.fulfill({ contentType: 'text/html', body: html });
        }
        if (url.pathname.startsWith('/dist/')) {
            return route.fulfill({ path: path.join(__dirname, '..', url.pathname) });
        }
        // Any other script: an unrelated library
        return route.fulfill({ contentType: 'text/javascript', body: 'window.otherLoaded = true;' });
    });
    const warnings = [];
    page.on('console', (msg) => { if (msg.type() === 'warning') warnings.push(msg.text()); });
    await page.goto(`${ORIGIN}/`);
    await page.waitForFunction(() => window.done === true);
    return warnings;
}

test('an ESM import of Gia ignores data-auto-mount on an unrelated script', async ({ page }) => {
    const warnings = await serve(page, `<!doctype html>
        <div data-component="Box"></div>
        <script src="/vendor/other-widget.js" data-auto-mount></script>
        <script type="module">
            import { config } from '/dist/gia.full.mjs';
            window.autoMount = config.get('autoMountComponents');
            setTimeout(() => { window.done = true; }, 50);
        </script>`);
    expect(await page.evaluate(() => window.autoMount)).toBe(false);
    // loadComponents() did not run either (it would warn that "Box" was not found)
    expect(warnings.filter((w) => w.includes('not found'))).toEqual([]);
});

test('a module tag loading the Gia ESM bundle with data-auto-mount enables auto-mounting', async ({ page }) => {
    await serve(page, `<!doctype html>
        <script type="module" src="/dist/gia.full.mjs" data-auto-mount></script>
        <script type="module">
            import { config, BaseComponent, register } from '/dist/gia.full.mjs';
            window.autoMount = config.get('autoMountComponents');
            class Box extends BaseComponent { mount() { window.mounted = true; } }
            register(Box);
            const el = document.createElement('div');
            el.setAttribute('data-component', 'Box');
            document.body.appendChild(el);
            setTimeout(() => { window.done = true; }, 50);
        </script>`);
    expect(await page.evaluate(() => window.autoMount)).toBe(true);
    expect(await page.evaluate(() => window.mounted)).toBe(true);
});

test('a mini UMD tag with data-auto-mount does not turn on auto-mounting for a full ESM copy', async ({ page }) => {
    await serve(page, `<!doctype html>
        <script src="/dist/gia.mini.umd.js" data-auto-mount></script>
        <script type="module">
            import { config } from '/dist/gia.full.mjs';
            window.autoMount = config.get('autoMountComponents');
            setTimeout(() => { window.done = true; }, 50);
        </script>`);
    expect(await page.evaluate(() => window.autoMount)).toBe(false);
});

test('the UMD tag with data-auto-mount still mounts and enables auto-mounting', async ({ page }) => {
    await serve(page, `<!doctype html>
        <div data-component="Box"></div>
        <script src="/dist/gia.full.umd.js"></script>
        <script>
            window.Box = class Box extends gia.BaseComponent { mount() { window.mounted = true; } };
        </script>
        <script src="/dist/gia.full.umd.js?second" data-auto-mount></script>
        <script>
            window.autoMount = gia.config.get('autoMountComponents');
            window.done = true;
        </script>`);
    expect(await page.evaluate(() => window.autoMount)).toBe(true);
    expect(await page.evaluate(() => window.mounted)).toBe(true);
});
