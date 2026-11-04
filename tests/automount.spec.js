import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import config from '../src/config.js';
import { initObserver } from '../src/autoMount.js';
import { components as store } from '../src/store.js';

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


    test('should keep the instance and its state when a mounted element is moved within the DOM', async () => {
        let mounts = 0;
        let unmounts = 0;

        class SortableItem extends BaseComponent {
            mount() { mounts++; }
            unmount() { unmounts++; }
        }
        class Inner extends BaseComponent {
            unmount() { unmounts++; }
        }

        window.gia.components.SortableItem = SortableItem;
        window.gia.components.Inner = Inner;
        config.set('autoMountComponents', true);

        const list = document.createElement('ul');
        list.innerHTML =
            '<li data-component="SortableItem" id="first"><span data-component="Inner"></span></li>' +
            '<li data-component="SortableItem" id="second"></li>';
        document.body.appendChild(list);
        await new Promise((r) => setTimeout(r, 20));
        expect(mounts).toBe(2);

        const first = document.getElementById('first');
        const instance = store.get(first);
        const inner = store.get(first.firstChild);
        instance.marker = 'kept';

        list.appendChild(first); // move to the end: removed + added in one batch
        await new Promise((r) => setTimeout(r, 20));

        expect(unmounts).toBe(0);
        expect(mounts).toBe(2);
        expect(store.get(first)).toBe(instance);
        expect(store.get(first.firstChild)).toBe(inner);
        expect(instance.marker).toBe('kept');
    });

    test('should still destroy components moved out of the document', async () => {
        let unmounts = 0;

        class Detachable extends BaseComponent {
            unmount() { unmounts++; }
        }

        window.gia.components.Detachable = Detachable;
        config.set('autoMountComponents', true);

        const el = document.createElement('div');
        el.setAttribute('data-component', 'Detachable');
        document.body.appendChild(el);
        await new Promise((r) => setTimeout(r, 20));
        expect(store.get(el)).toBeDefined();

        document.createElement('div').appendChild(el); // detached container
        await new Promise((r) => setTimeout(r, 20));

        expect(unmounts).toBe(1);
        expect(store.get(el)).toBeUndefined();
    });


    test.describe('component attribute changes on elements already in the DOM', () => {
        const tick = () => new Promise((r) => setTimeout(r, 20));
        let log;

        test.beforeEach(() => {
            log = [];
            class Alpha extends BaseComponent {
                mount() { log.push('mount Alpha'); }
                unmount() { log.push('unmount Alpha'); }
            }
            class Beta extends BaseComponent {
                mount() { log.push('mount Beta'); }
                unmount() { log.push('unmount Beta'); }
            }
            window.gia.components.Alpha = Alpha;
            window.gia.components.Beta = Beta;
        });

        test.afterEach(() => {
            config.set('attrPrefix', 'data');
        });

        test('adding data-component mounts, changing it swaps, removing it destroys', async () => {
            const el = document.createElement('div');
            document.body.appendChild(el);
            config.set('autoMountComponents', true);

            el.setAttribute('data-component', 'Alpha');
            await tick();
            expect(log).toEqual(['mount Alpha']);
            const alpha = store.get(el);
            expect(alpha.constructor.name).toBe('Alpha');

            el.setAttribute('data-component', 'Beta');
            await tick();
            expect(log).toEqual(['mount Alpha', 'unmount Alpha', 'mount Beta']);
            expect(store.get(el).constructor.name).toBe('Beta');

            el.removeAttribute('data-component');
            await tick();
            expect(log).toEqual(['mount Alpha', 'unmount Alpha', 'mount Beta', 'unmount Beta']);
            expect(store.has(el)).toBe(false);
        });

        test('setting the same value, or changing and restoring it in one batch, keeps the instance', async () => {
            config.set('autoMountComponents', true);
            const el = document.createElement('div');
            el.setAttribute('data-component', 'Alpha');
            document.body.appendChild(el);
            await tick();
            const instance = store.get(el);

            el.setAttribute('data-component', 'Alpha');
            el.setAttribute('data-component', 'Beta');
            el.setAttribute('data-component', 'Alpha');
            el.setAttribute('data-other', 'x'); // not observed
            await tick();

            expect(store.get(el)).toBe(instance);
            expect(log).toEqual(['mount Alpha']);
        });

        test('an element removed right after its attribute changed is only destroyed', async () => {
            config.set('autoMountComponents', true);
            const el = document.createElement('div');
            el.setAttribute('data-component', 'Alpha');
            document.body.appendChild(el);
            await tick();

            el.removeAttribute('data-component');
            el.remove();
            await tick();

            expect(log).toEqual(['mount Alpha', 'unmount Alpha']);
            expect(store.has(el)).toBe(false);
        });

        test('the attribute filter follows a changed attrPrefix', async () => {
            config.set('autoMountComponents', true);
            config.set('attrPrefix', 'g');

            const el = document.createElement('div');
            document.body.appendChild(el);
            el.setAttribute('g-component', 'Alpha');
            await tick();

            expect(log).toEqual(['mount Alpha']);
        });
    });
});
