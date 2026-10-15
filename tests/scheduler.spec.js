import { test, expect } from '@playwright/test';
import { JSDOM } from 'jsdom';
import { measure, mutate, clear } from '../src/scheduler.js';

test.describe('DOM Scheduler (measure, mutate, clear)', () => {
    let dom;
    let window;

    test.beforeEach(() => {
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
            url: 'http://localhost/'
        });
        window = dom.window;
        global.window = window;

        // Provide standard requestAnimationFrame in test environment
        const raf = (cb) => setTimeout(cb, 0);
        const caf = (id) => clearTimeout(id);
        window.requestAnimationFrame = raf;
        window.cancelAnimationFrame = caf;
        global.requestAnimationFrame = raf;
        global.cancelAnimationFrame = caf;
    });

    test.afterEach(() => {
        delete global.window;
        delete global.requestAnimationFrame;
        delete global.cancelAnimationFrame;
    });

    test('should execute all measure reads before any mutate writes regardless of schedule order', async () => {
        const order = [];

        mutate(() => {
            order.push('write-1');
        });

        measure(() => {
            order.push('read-1');
        });

        mutate(() => {
            order.push('write-2');
        });

        measure(() => {
            order.push('read-2');
        });

        await new Promise((r) => setTimeout(r, 20));

        expect(order).toEqual(['read-1', 'read-2', 'write-1', 'write-2']);
    });

    test('should maintain correct context when passed to measure and mutate', async () => {
        const contextA = { name: 'ContextA', value: 0 };
        const contextB = { name: 'ContextB', value: 0 };

        measure(function () {
            expect(this).toBe(contextA);
            this.value = 42;
        }, contextA);

        mutate(function () {
            expect(this).toBe(contextB);
            this.value = 99;
        }, contextB);

        await new Promise((r) => setTimeout(r, 20));

        expect(contextA.value).toBe(42);
        expect(contextB.value).toBe(99);
    });

    test('should successfully cancel scheduled tasks with clear()', async () => {
        let readExecuted = false;
        let writeExecuted = false;

        const readTask = measure(() => {
            readExecuted = true;
        });

        const writeTask = mutate(() => {
            writeExecuted = true;
        });

        const clearedRead = clear(readTask);
        const clearedWrite = clear(writeTask);

        expect(clearedRead).toBe(true);
        expect(clearedWrite).toBe(true);

        await new Promise((r) => setTimeout(r, 20));

        expect(readExecuted).toBe(false);
        expect(writeExecuted).toBe(false);
    });

    test('should clear context-bound tasks correctly by function reference or wrapper', async () => {
        let taskExecuted = false;
        const ctx = { id: 1 };
        const rawFn = function () {
            taskExecuted = true;
        };

        const task = measure(rawFn, ctx);

        // Clearing by rawFn or task reference should return true
        const cleared = clear(rawFn);
        expect(cleared).toBe(true);

        await new Promise((r) => setTimeout(r, 20));
        expect(taskExecuted).toBe(false);
    });

    test('should return false when clear() is called with a non-existent task', () => {
        const nonExistent = () => {};
        expect(clear(nonExistent)).toBe(false);
    });

    test('should continue executing remaining tasks even if one task throws an error', async () => {
        const executed = [];
        const originalError = console.error;
        console.error = () => {}; // Suppress expected console.error during test

        try {
            measure(() => {
                executed.push('measure-1');
                throw new Error('Test error in measure');
            });

            measure(() => {
                executed.push('measure-2');
            });

            mutate(() => {
                executed.push('mutate-1');
                throw new Error('Test error in mutate');
            });

            mutate(() => {
                executed.push('mutate-2');
            });

            await new Promise((r) => setTimeout(r, 20));

            expect(executed).toEqual(['measure-1', 'measure-2', 'mutate-1', 'mutate-2']);
        } finally {
            console.error = originalError;
        }
    });

    test('should schedule another frame if new tasks are enqueued during flush', () => {
        const order = [];
        const queue = [];
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = (cb) => {
            queue.push(cb);
            return queue.length;
        };

        try {
            mutate(() => {
                order.push('frame1-write');
                measure(() => {
                    order.push('frame2-read');
                });
                mutate(() => {
                    order.push('frame2-write');
                });
            });

            // Frame 1 scheduled
            expect(queue.length).toBe(1);

            // Execute frame 1
            const frame1 = queue.shift();
            frame1();

            // Frame 1 should have run its write and scheduled frame 2
            expect(order).toEqual(['frame1-write']);
            expect(queue.length).toBe(1);

            // Execute frame 2
            const frame2 = queue.shift();
            frame2();

            // Both frames finished in correct order
            expect(order).toEqual(['frame1-write', 'frame2-read', 'frame2-write']);
            expect(queue.length).toBe(0);
        } finally {
            window.requestAnimationFrame = originalRAF;
        }
    });
});
