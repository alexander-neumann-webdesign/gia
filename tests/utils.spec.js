import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import {
    query,
    queryAll,
    toggleClass,
    addClass,
    removeClass,
    triggerEvent,
    debounce,
} from '../src/utils.js';

test.describe('DOM and Functional Utilities (utils.js)', () => {
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
        global.Node = window.Node;
        global.Element = window.Element;
        global.HTMLElement = window.HTMLElement;
        global.CustomEvent = window.CustomEvent;
        global.Event = window.Event;
    });

    test.afterEach(() => {
        delete global.window;
        delete global.document;
        delete global.Node;
        delete global.Element;
        delete global.HTMLElement;
        delete global.CustomEvent;
        delete global.Event;
    });

    test('query & queryAll should query elements within document or context', () => {
        document.body.innerHTML = `
            <div id="container-a">
                <span class="target">A1</span>
                <span class="target">A2</span>
            </div>
            <div id="container-b">
                <span class="target">B1</span>
            </div>
        `;

        const containerA = document.getElementById('container-a');

        // Global query
        const firstTarget = query('.target');
        expect(firstTarget.textContent).toBe('A1');

        // Scoped query
        const bTarget = query('.target', document.getElementById('container-b'));
        expect(bTarget.textContent).toBe('B1');

        // Global queryAll
        const allTargets = queryAll('.target');
        expect(allTargets.length).toBe(3);

        // Scoped queryAll
        const aTargets = queryAll('.target', containerA);
        expect(aTargets.length).toBe(2);

        // Non-string input should be returned directly
        expect(query(containerA)).toBe(containerA);
        expect(queryAll(containerA)).toBe(containerA);
    });

    test('toggleClass should toggle classes with and without condition', () => {
        const el = document.createElement('div');

        // Without condition
        toggleClass(el, 'active');
        expect(el.classList.contains('active')).toBe(true);

        toggleClass(el, 'active');
        expect(el.classList.contains('active')).toBe(false);

        // With condition: true
        toggleClass(el, 'active', true);
        expect(el.classList.contains('active')).toBe(true);
        toggleClass(el, 'active', true);
        expect(el.classList.contains('active')).toBe(true);

        // With condition: false
        toggleClass(el, 'active', false);
        expect(el.classList.contains('active')).toBe(false);
    });

    test('addClass and removeClass should work on single elements, arrays, and NodeLists', () => {
        document.body.innerHTML = `
            <span class="item" id="item-1"></span>
            <span class="item" id="item-2"></span>
        `;

        const single = document.getElementById('item-1');
        const list = document.querySelectorAll('.item');
        const array = [document.getElementById('item-1'), document.getElementById('item-2')];

        // Single element
        addClass(single, 'highlight');
        expect(single.classList.contains('highlight')).toBe(true);
        removeClass(single, 'highlight');
        expect(single.classList.contains('highlight')).toBe(false);

        // Array of elements
        addClass(array, 'in-array');
        expect(array[0].classList.contains('in-array')).toBe(true);
        expect(array[1].classList.contains('in-array')).toBe(true);
        removeClass(array, 'in-array');
        expect(array[0].classList.contains('in-array')).toBe(false);
        expect(array[1].classList.contains('in-array')).toBe(false);

        // NodeList
        addClass(list, 'in-list');
        expect(list[0].classList.contains('in-list')).toBe(true);
        expect(list[1].classList.contains('in-list')).toBe(true);
        removeClass(list, 'in-list');
        expect(list[0].classList.contains('in-list')).toBe(false);
        expect(list[1].classList.contains('in-list')).toBe(false);

        // Null / undefined safety
        expect(addClass(null, 'foo')).toBe(null);
        expect(removeClass(null, 'foo')).toBe(null);
    });

    test('addClass, removeClass, and toggleClass should support space-separated multi-token class strings', () => {
        const el = document.createElement('div');
        addClass(el, 'btn btn-primary active');
        expect(el.classList.contains('btn')).toBe(true);
        expect(el.classList.contains('btn-primary')).toBe(true);
        expect(el.classList.contains('active')).toBe(true);

        removeClass(el, 'btn-primary active');
        expect(el.classList.contains('btn')).toBe(true);
        expect(el.classList.contains('btn-primary')).toBe(false);
        expect(el.classList.contains('active')).toBe(false);

        toggleClass(el, 'foo bar');
        expect(el.classList.contains('foo')).toBe(true);
        expect(el.classList.contains('bar')).toBe(true);

        toggleClass(el, 'foo bar', false);
        expect(el.classList.contains('foo')).toBe(false);
        expect(el.classList.contains('bar')).toBe(false);
    });

    test('addClass should treat elements with a length property (like form) as a single node', () => {
        document.body.innerHTML = `
            <form id="test-form">
                <input name="field1" value="a" />
                <input name="field2" value="b" />
            </form>
        `;

        const form = document.getElementById('test-form');
        // HTMLFormElement has length equal to the number of controls
        expect(form.length).toBe(2);
        expect(form.nodeType).toBe(1);

        addClass(form, 'form-validated');
        expect(form.classList.contains('form-validated')).toBe(true);

        removeClass(form, 'form-validated');
        expect(form.classList.contains('form-validated')).toBe(false);
    });

    test('triggerEvent should dispatch custom events with params and bubbling options', () => {
        const parent = document.createElement('div');
        const child = document.createElement('button');
        parent.appendChild(child);
        document.body.appendChild(parent);

        let receivedDetail = null;
        let bubbledToParent = false;

        parent.addEventListener('custom:action', (e) => {
            bubbledToParent = true;
            receivedDetail = e.detail;
        });

        triggerEvent(child, 'custom:action', { count: 42 });

        expect(bubbledToParent).toBe(true);
        expect(receivedDetail).toEqual({ count: 42 });
    });

    test('debounce should debounce calls, pass latest arguments, preserve context, and support cancel()', async () => {
        let callCount = 0;
        let lastValue = null;
        let contextChecked = null;

        const obj = {
            handle: debounce(function (val) {
                callCount++;
                lastValue = val;
                contextChecked = this;
            }, 30)
        };

        // Fire 3 times rapidly
        obj.handle('first');
        obj.handle('second');
        obj.handle('third');

        // Should not have executed synchronously
        expect(callCount).toBe(0);

        // Wait for debounce timeout
        await new Promise((r) => setTimeout(r, 60));

        expect(callCount).toBe(1);
        expect(lastValue).toBe('third');
        expect(contextChecked).toBe(obj);

        // Test cancel()
        obj.handle('fourth');
        obj.handle.cancel();

        await new Promise((r) => setTimeout(r, 60));
        expect(callCount).toBe(1); // Still 1, cancelled
    });
});
