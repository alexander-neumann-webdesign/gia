import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { loadScript, loadStyle } from '../src/loaders.js';

test.describe('Script and Style Loaders with DOM Clobbering Protection (loaders.js)', () => {
    let dom;
    let window;
    let document;

    test.beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>', {
            url: 'http://localhost/'
        });
        window = dom.window;
        document = window.document;

        global.window = window;
        global.document = document;
        global.HTMLScriptElement = window.HTMLScriptElement;
        global.HTMLLinkElement = window.HTMLLinkElement;
        global.Node = window.Node;
        global.HTMLCollection = window.HTMLCollection;
        global.Window = window.Window;
    });

    test.afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.HTMLScriptElement;
        delete global.HTMLLinkElement;
        delete global.Node;
        delete global.HTMLCollection;
        delete global.Window;
    });

    test('loadScript should move data-src to src and resolve with window global', async () => {
        const script = document.createElement('script');
        script.id = 'my-lib-script';
        script.setAttribute('data-src', '/vendor/mylib.js');
        document.body.appendChild(script);

        const promise = loadScript('my-lib-script', 'MyLib');

        // Verify data-src was moved to src
        expect(script.getAttribute('src')).toBe('/vendor/mylib.js');
        expect(script.hasAttribute('data-src')).toBe(false);

        // Simulate script load event and mock global variable
        window.MyLib = { version: '1.0.0' };
        script.onload();

        const result = await promise;
        expect(result).toEqual({ version: '1.0.0' });
    });

    test('loadScript should reject if element with ID is not an HTMLScriptElement (DOM clobbering protection)', async () => {
        // Create an img tag or div with the target ID instead of a script tag
        const maliciousImg = document.createElement('img');
        maliciousImg.id = 'clobbered-id';
        maliciousImg.setAttribute('data-src', 'evil.js');
        document.body.appendChild(maliciousImg);

        await expect(loadScript('clobbered-id')).rejects.toThrow(
            "Element with ID 'clobbered-id' is not a valid script tag."
        );
    });

    test('loadScript should reject if script tag does not exist', async () => {
        await expect(loadScript('non-existent-script')).rejects.toThrow(
            "Script tag with ID 'non-existent-script' not found."
        );
    });

    test('loadScript should reuse in-flight promise for concurrent calls', async () => {
        const script = document.createElement('script');
        script.id = 'concurrent-script';
        script.setAttribute('data-src', '/vendor/concurrent.js');
        document.body.appendChild(script);

        const p1 = loadScript('concurrent-script');
        const p2 = loadScript('concurrent-script');

        // Both calls should return the identical cached promise
        expect(p1).toBe(p2);

        script.onload();
        const [r1, r2] = await Promise.all([p1, p2]);
        expect(r1).toBe(true);
        expect(r2).toBe(true);
    });

    test('loadStyle should move data-href to href and resolve on load', async () => {
        const link = document.createElement('link');
        link.id = 'main-theme-css';
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('data-href', '/assets/theme.css');
        document.head.appendChild(link);

        const promise = loadStyle('main-theme-css');

        expect(link.getAttribute('href')).toBe('/assets/theme.css');
        expect(link.hasAttribute('data-href')).toBe(false);

        link.onload();
        const result = await promise;
        expect(result).toBe(true);
    });

    test('loadStyle should reject if element with ID is not an HTMLLinkElement (DOM clobbering protection)', async () => {
        const div = document.createElement('div');
        div.id = 'fake-style';
        document.body.appendChild(div);

        await expect(loadStyle('fake-style')).rejects.toThrow(
            "Element with ID 'fake-style' is not a valid link tag."
        );
    });

    test('loadStyle should reject if link tag does not exist', async () => {
        await expect(loadStyle('non-existent-style')).rejects.toThrow(
            "Link tag with ID 'non-existent-style' not found."
        );
    });
});
