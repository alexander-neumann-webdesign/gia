import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import loadComponents from '../src/loadComponents.js';
import { initRegistry } from '../src/registry.js';

test.describe('Component Priority & Global Registry (loadComponents.js & registry.js)', () => {
    let dom;
    let window;
    let document;

    test.beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost/'
        });
        window = dom.window;
        document = window.document;

        global.window = window;
        global.document = document;
        global.Element = window.Element;
        global.Node = window.Node;

        initRegistry();
    });

    test.afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Element;
        delete global.Node;
    });

    test('loadComponents should mount components with higher priority first', () => {
        const mountOrder = [];

        class LowPriorityComponent extends BaseComponent {
            static priority = 10;
            mount() {
                mountOrder.push('low');
            }
        }

        class HighPriorityComponent extends BaseComponent {
            static priority = 100;
            mount() {
                mountOrder.push('high');
            }
        }

        class MediumPriorityComponent extends BaseComponent {
            static priority = 50;
            mount() {
                mountOrder.push('medium');
            }
        }

        // Add them to DOM in low -> medium -> high order
        document.body.innerHTML = `
            <div data-component="LowPriorityComponent"></div>
            <div data-component="MediumPriorityComponent"></div>
            <div data-component="HighPriorityComponent"></div>
        `;

        loadComponents({
            LowPriorityComponent,
            MediumPriorityComponent,
            HighPriorityComponent
        }, document.body);

        // Expect high (100) -> medium (50) -> low (10)
        expect(mountOrder).toEqual(['high', 'medium', 'low']);
    });

    test('gia.register should assign priority to Component and store in window.gia.components', () => {
        class ProductCard extends BaseComponent {}

        window.gia.register(ProductCard, { priority: 75 });

        expect(window.gia.components.ProductCard).toBe(ProductCard);
        expect(ProductCard._gia_priority).toBe(75);
    });

    test('gia.register should reject invalid inputs with console error', () => {
        const originalError = console.error;
        let errorMessage = null;
        console.error = (msg, arg) => {
            errorMessage = msg;
        };

        try {
            window.gia.register('not a component');
            expect(errorMessage).toContain('Gia: Register failed. Expected a Class, got:');
        } finally {
            console.error = originalError;
        }
    });

    test('loadComponents should handle empty or undefined components safely', () => {
        const originalWarn = console.warn;
        let warned = false;
        console.warn = () => {
            warned = true;
        };

        try {
            loadComponents(null, document.body);
            expect(warned).toBe(true);

            warned = false;
            loadComponents({}, document.body);
            expect(warned).toBe(true);
        } finally {
            console.warn = originalWarn;
        }
    });

    test('loadComponents should preserve natural DOM top-to-bottom order when no custom priority is defined', () => {
        const mountOrder = [];

        class FirstComponent extends BaseComponent {
            mount() {
                mountOrder.push('first');
            }
        }

        class SecondComponent extends BaseComponent {
            mount() {
                mountOrder.push('second');
            }
        }

        class ThirdComponent extends BaseComponent {
            mount() {
                mountOrder.push('third');
            }
        }

        document.body.innerHTML = `
            <div data-component="FirstComponent"></div>
            <div data-component="SecondComponent"></div>
            <div data-component="ThirdComponent"></div>
        `;

        loadComponents({
            FirstComponent,
            SecondComponent,
            ThirdComponent
        }, document.body);

        expect(mountOrder).toEqual(['first', 'second', 'third']);
    });
});
