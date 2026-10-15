import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import BaseComponent from '../src/BaseComponent.js';
import loadComponents from '../src/loadComponents.js';
import config from '../src/config.js';

test.describe('Nested Component Ref & Action Isolation', () => {
    let dom;
    let window;
    let document;
    let originalAbortController;
    let originalAbortSignal;

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
        originalAbortController = global.AbortController;
        originalAbortSignal = global.AbortSignal;
        global.AbortController = window.AbortController;
        global.AbortSignal = window.AbortSignal;
        global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
        global.cancelAnimationFrame = (id) => clearTimeout(id);
    });

    test.afterEach(() => {
        config.set('autoBindActions', false);
        config.set('log', false);
        delete global.window;
        delete global.document;
        delete global.Node;
        delete global.Element;
        delete global.HTMLElement;
        delete global.CustomEvent;
        delete global.Event;
        if (originalAbortController !== undefined) {
            global.AbortController = originalAbortController;
        } else {
            delete global.AbortController;
        }
        if (originalAbortSignal !== undefined) {
            global.AbortSignal = originalAbortSignal;
        } else {
            delete global.AbortSignal;
        }
        delete global.requestAnimationFrame;
        delete global.cancelAnimationFrame;
    });

    test('should isolate single refs between parent and nested child component', () => {
        document.body.innerHTML = `
            <div data-component="ParentComponent" id="parent">
                <button data-ref="btn" id="parent-btn">Parent</button>
                <div data-component="ChildComponent" id="child">
                    <button data-ref="btn" id="child-btn">Child</button>
                </div>
            </div>
        `;

        let parentInstance;
        let childInstance;

        class ParentComponent extends BaseComponent {
            constructor(el) {
                super(el);
                parentInstance = this;
                this.ref = { btn: null };
            }
        }

        class ChildComponent extends BaseComponent {
            constructor(el) {
                super(el);
                childInstance = this;
                this.ref = { btn: null };
            }
        }

        loadComponents({ ParentComponent, ChildComponent }, document.body);

        expect(parentInstance).toBeDefined();
        expect(childInstance).toBeDefined();

        expect(parentInstance.ref.btn.id).toBe('parent-btn');
        expect(childInstance.ref.btn.id).toBe('child-btn');
    });

    test('should isolate array refs between parent and nested child component', () => {
        document.body.innerHTML = `
            <div data-component="ParentComponent" id="parent">
                <span data-ref="items" id="p1">P1</span>
                <span data-ref="items" id="p2">P2</span>
                <div data-component="ChildComponent" id="child">
                    <span data-ref="items" id="c1">C1</span>
                    <span data-ref="items" id="c2">C2</span>
                </div>
            </div>
        `;

        let parentInstance;
        let childInstance;

        class ParentComponent extends BaseComponent {
            constructor(el) {
                super(el);
                parentInstance = this;
                this.ref = { items: [] };
            }
        }

        class ChildComponent extends BaseComponent {
            constructor(el) {
                super(el);
                childInstance = this;
                this.ref = { items: [] };
            }
        }

        loadComponents({ ParentComponent, ChildComponent }, document.body);

        expect(parentInstance.ref.items.map(el => el.id)).toEqual(['p1', 'p2']);
        expect(childInstance.ref.items.map(el => el.id)).toEqual(['c1', 'c2']);
    });

    test('should allow parent to capture child refs when explicitly namespaced', () => {
        document.body.innerHTML = `
            <div data-component="ParentComponent" id="parent">
                <button data-ref="btn" id="parent-btn">Parent</button>
                <div data-component="ChildComponent" id="child">
                    <button data-ref="btn" id="child-btn">Child</button>
                    <input data-ref="ParentComponent:delegatedInput" id="delegated" />
                </div>
            </div>
        `;

        let parentInstance;
        let childInstance;

        class ParentComponent extends BaseComponent {
            constructor(el) {
                super(el);
                parentInstance = this;
                this.ref = {
                    btn: null,
                    delegatedInput: null
                };
            }
        }

        class ChildComponent extends BaseComponent {
            constructor(el) {
                super(el);
                childInstance = this;
                this.ref = { btn: null };
            }
        }

        loadComponents({ ParentComponent, ChildComponent }, document.body);

        expect(parentInstance.ref.btn.id).toBe('parent-btn');
        expect(childInstance.ref.btn.id).toBe('child-btn');
        expect(parentInstance.ref.delegatedInput.id).toBe('delegated');
    });

    test('should isolate data-action events between parent and child component', () => {
        config.set('autoBindActions', true);

        document.body.innerHTML = `
            <div data-component="ParentComponent" id="parent">
                <button data-action="click->handleClick" id="parent-btn">Parent Action</button>
                <div data-component="ChildComponent" id="child">
                    <button data-action="click->handleClick" id="child-btn">Child Action</button>
                </div>
            </div>
        `;

        let parentClicks = 0;
        let childClicks = 0;

        class ParentComponent extends BaseComponent {
            handleClick() {
                parentClicks++;
            }
        }

        class ChildComponent extends BaseComponent {
            handleClick() {
                childClicks++;
            }
        }

        loadComponents({ ParentComponent, ChildComponent }, document.body);

        const parentBtn = document.getElementById('parent-btn');
        const childBtn = document.getElementById('child-btn');

        // Click child button - should NOT trigger parent's handleClick handler
        childBtn.dispatchEvent(new Event('click', { bubbles: false }));
        expect(childClicks).toBe(1);
        expect(parentClicks).toBe(0);

        // Click parent button - should trigger parent's handleClick handler
        parentBtn.dispatchEvent(new Event('click', { bubbles: false }));
        expect(childClicks).toBe(1);
        expect(parentClicks).toBe(1);
    });

    test('should isolate refs when using empty ref object this.ref = {}', () => {
        document.body.innerHTML = `
            <div data-component="ParentComponent" id="parent">
                <div data-ref="header" id="p-header">Header</div>
                <div data-component="ChildComponent" id="child">
                    <div data-ref="header" id="c-header">Header</div>
                </div>
            </div>
        `;

        let parentInstance;
        let childInstance;

        class ParentComponent extends BaseComponent {
            constructor(el) {
                super(el);
                parentInstance = this;
                this.ref = {};
            }
        }

        class ChildComponent extends BaseComponent {
            constructor(el) {
                super(el);
                childInstance = this;
                this.ref = {};
            }
        }

        loadComponents({ ParentComponent, ChildComponent }, document.body);

        expect(parentInstance.ref.header.map(el => el.id)).toEqual(['p-header']);
        expect(childInstance.ref.header.map(el => el.id)).toEqual(['c-header']);
    });
});
