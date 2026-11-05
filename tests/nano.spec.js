const { test, expect } = require('@playwright/test');
const path = require('path');

const dist = (file) => path.join(__dirname, '../dist', file);

async function load(page, bundle) {
    const warnings = [];
    page.on('console', (msg) => { if (msg.type() === 'warning') warnings.push(msg.text()); });
    await page.setContent('<body><div id="host" data-component="Probe"></div></body>');
    await page.addScriptTag({ path: dist(bundle) });
    return warnings;
}

test('nano warns once per API that does nothing in its build', async ({ page }) => {
    const warnings = await load(page, 'gia.nano.umd.js');
    const result = await page.evaluate(async () => {
        class Probe extends gia.BaseComponent {
            mount() {
                this.observeScroll(() => {});
                this.observeScroll(() => {});
                this.observeWindowResize(() => {});
                this.observeResize(this.element, () => {});
                this.observeIntersection(this.element, () => {});
                this.stop = this.observeMediaQuery('(min-width: 1px)', () => {});
            }
        }
        gia.loadComponents({ Probe });
        const probe = gia.getComponentFromElement('host');
        await probe.loadScript('/missing.js');
        await probe.loadStyle('/missing.css');
        return { stopIsFunction: typeof probe.stop === 'function' };
    });
    expect(result.stopIsFunction).toBe(true);
    const nano = warnings.filter((w) => w.includes('nano build'));
    expect(nano.map((w) => w.match(/Gia: (\w+)\(\)/)[1])).toEqual([
        'observeScroll',
        'observeWindowResize',
        'observeResize',
        'observeIntersection',
        'observeMediaQuery',
        'loadScript',
        'loadStyle',
    ]);
});

test('mini does not warn about nano-only limitations', async ({ page }) => {
    const warnings = await load(page, 'gia.mini.umd.js');
    await page.evaluate(() => {
        class Probe extends gia.BaseComponent {
            mount() { this.observeScroll(() => {}); }
        }
        gia.loadComponents({ Probe });
    });
    expect(warnings.filter((w) => w.includes('nano build'))).toEqual([]);
});

test('nano reads options from HTML attributes and data-options JSON', async ({ page }) => {
    await page.setContent(`<body>
        <div id="a" data-component="Opts" data-size="3" data-auto-play data-label="007"></div>
        <div id="b" data-component="Opts" data-options='{"size": 9, "label": "json"}'></div>
    </body>`);
    await page.addScriptTag({ path: dist('gia.nano.umd.js') });
    const result = await page.evaluate(() => {
        class Opts extends gia.BaseComponent {
            constructor(el) {
                super(el);
                this.options = { size: 1, autoPlay: false, label: '' };
            }
        }
        gia.loadComponents({ Opts });
        return ['a', 'b'].map((id) => gia.getComponentFromElement(id).options);
    });
    expect(result).toEqual([
        { size: 3, autoPlay: true, label: '007' },
        { size: 9, autoPlay: false, label: 'json' },
    ]);
});
