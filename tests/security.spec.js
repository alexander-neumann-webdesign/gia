const { test, expect } = require('@playwright/test');
const path = require('path');

// End-to-end check in a real browser against the built bundles: markup alone must not be able
// to make Gia call arbitrary global functions. Native setTimeout evaluates string arguments,
// and an <a> element stringifies to its href, so `data-component="setTimeout"` on a
// `mailto:`/`tel:` link used to execute the href as JavaScript.
const builds = ['gia.full.umd.js', 'gia.mini.umd.js', 'gia.nano.umd.js'];

for (const build of builds) {
    test.describe(`${build}: data-component resolution`, () => {
        test('markup cannot invoke global functions such as setTimeout', async ({ page }) => {
            await page.setContent(`
                <a data-component="setTimeout" href="mailto:window.__pwned=(window.__pwned||[]).concat('mailto')">a</a>
                <a data-component="setTimeout" href="tel:window.__pwned=(window.__pwned||[]).concat('tel')">b</a>
                <div data-component="siteFn"></div>
            `);
            await page.evaluate(() => {
                window.siteFn = () => {
                    window.__pwned = (window.__pwned || []).concat('siteFn');
                };
            });
            await page.addScriptTag({ path: path.join(__dirname, '../dist', build) });
            await page.evaluate(() => window.gia.loadComponents());
            await page.waitForTimeout(100);

            expect(await page.evaluate(() => window.__pwned || null)).toBe(null);
        });

        test('Gia component classes exposed on window still mount', async ({ page }) => {
            await page.setContent('<div data-component="Counter"></div><div data-component="Splide"></div>');
            await page.addScriptTag({ path: path.join(__dirname, '../dist', build) });
            const result = await page.evaluate(() => {
                window.Counter = class extends window.gia.BaseComponent {
                    mount() {
                        this.element.setAttribute('data-mounted', 'yes');
                    }
                };
                // A non-Gia class with a mount() method must be ignored
                window.Splide = class {
                    constructor() {
                        window.__splideConstructed = true;
                    }
                    mount() {}
                };
                window.gia.loadComponents();
                return {
                    counter: document.querySelector('[data-component="Counter"]').getAttribute('data-mounted'),
                    splide: !!window.__splideConstructed,
                };
            });
            expect(result).toEqual({ counter: 'yes', splide: false });
        });
    });
}
