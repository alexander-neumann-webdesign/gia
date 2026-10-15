import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import config from '../src/config.js';
import { initObserver } from '../src/autoMount.js';

test.describe('Auto-Mounting via MutationObserver (autoMount.js)', () => {
    let dom;
    let window;
    let document;

    test.beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost/'
        });
        window = dom.window;
        document = window.document;

        // Provide MutationObserver from JSDOM
        global.window = window;
        global.document = document;
        global.Element = window.Element;
        global.Node = window.Node;
        global.MutationObserver = window.MutationObserver;

        window.gia = { components: {} };
    });

    test.afterEach(() => {
        config.set('autoMountComponents', false);
        delete global.window;
        delete global.document;
        delete global.Element;
        delete global.Node;
        delete global.MutationObserver;
    });

    test('should automatically mount when a component element is appended to DOM', async () => {
        let mounted = false;

        class DynamicCard extends BaseComponent {
            mount() {
                mounted = true;
            }
        }

        window.gia.components.DynamicCard = DynamicCard;
        config.set('autoMountComponents', true);

        // Inject element into DOM
        const el = document.createElement('div');
        el.setAttribute('data-component', 'DynamicCard');
        document.body.appendChild(el);

        // Wait for MutationObserver callback
        await new Promise((r) => setTimeout(r, 20));

        expect(mounted).toBe(true);
    });

    test('should automatically unmount when component element is removed from DOM', async () => {
        let unmounted = false;

        class RemovableCard extends BaseComponent {
            unmount() {
                unmounted = true;
            }
        }

        window.gia.components.RemovableCard = RemovableCard;
        config.set('autoMountComponents', true);

        const el = document.createElement('div');
        el.setAttribute('data-component', 'RemovableCard');
        document.body.appendChild(el);

        await new Promise((r) => setTimeout(r, 20));

        // Remove element
        document.body.removeChild(el);

        await new Promise((r) => setTimeout(r, 20));

        expect(unmounted).toBe(true);
    });

    test('should handle nested components inside injected container', async () => {
        const mounted = [];

        class ParentBox extends BaseComponent {
            mount() {
                mounted.push('ParentBox');
            }
        }

        class ChildBox extends BaseComponent {
            mount() {
                mounted.push('ChildBox');
            }
        }

        window.gia.components.ParentBox = ParentBox;
        window.gia.components.ChildBox = ChildBox;
        config.set('autoMountComponents', true);

        const container = document.createElement('div');
        container.setAttribute('data-component', 'ParentBox');
        container.innerHTML = '<div data-component="ChildBox"></div>';
        document.body.appendChild(container);

        await new Promise((r) => setTimeout(r, 20));

        expect(mounted).toContain('ParentBox');
        expect(mounted).toContain('ChildBox');
    });

    test('should disconnect and stop observing when autoMountComponents is set to false', async () => {
        let mounted = false;

        class IgnoredCard extends BaseComponent {
            mount() {
                mounted = true;
            }
        }

        window.gia.components.IgnoredCard = IgnoredCard;

        // Turn on then turn off
        config.set('autoMountComponents', true);
        config.set('autoMountComponents', false);

        const el = document.createElement('div');
        el.setAttribute('data-component', 'IgnoredCard');
        document.body.appendChild(el);

        await new Promise((r) => setTimeout(r, 20));

        expect(mounted).toBe(false);
    });
});
