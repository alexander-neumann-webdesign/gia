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
        expect(typeof miniDist.eventbus).toBe('object');
        expect(typeof miniDist.utils).toBe('object');
    });

    test('gia.nano.mjs should export minimal subset without Component or eventbus', () => {
        expect(typeof nanoDist.loadComponents).toBe('function');
        expect(typeof nanoDist.BaseComponent).toBe('function');
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

    test('should preserve window.__gia_scheduler__ without mangling collision', () => {
        // Scheduler should be attached to window without property mangling distortion
        fullDist.measure(() => {});
        expect(window.__gia_scheduler__).toBeDefined();
        expect(Array.isArray(window.__gia_scheduler__.reads)).toBe(true);
    });
});
