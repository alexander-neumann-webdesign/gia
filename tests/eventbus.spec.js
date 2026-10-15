import { test, expect } from '@playwright/test';
import eventbus from '../src/eventbus';
import config from '../src/config';

test.describe('EventBus', () => {
    test.afterEach(() => {
        // Reset config and other global-like states if needed
        config.set('log', false);
    });

    test('should emit and receive events', async () => {
        let received = null;
        const data = { foo: 'bar' };

        eventbus.on('test-event', (detail) => {
            received = detail;
        });

        eventbus.emit('test-event', data);

        expect(received).toMatchObject(data);
        expect(received._name).toBe('test-event');
    });

    test('should only trigger once with once()', async () => {
        let count = 0;
        eventbus.once('once-event', () => {
            count++;
        });

        eventbus.emit('once-event');
        eventbus.emit('once-event');

        expect(count).toBe(1);
    });

    test('should remove listeners with off()', async () => {
        let count = 0;
        const handler = () => {
            count++;
        };

        eventbus.on('off-event', handler);
        eventbus.emit('off-event');
        expect(count).toBe(1);

        eventbus.off('off-event', handler);
        eventbus.emit('off-event');
        expect(count).toBe(1);
    });

    test('should log when config log is enabled', async () => {
        let loggedMessage = null;
        const originalInfo = console.info;
        console.info = (msg) => {
            loggedMessage = msg;
        };

        try {
            config.set('log', true);
            eventbus.emit('log-event');
            expect(loggedMessage).toBe("Emitting event 'log-event'");
        } finally {
            console.info = originalInfo;
        }
    });

    test('should clear all listeners when off() is called without handler', async () => {
        let count = 0;
        eventbus.on('clear-event', () => { count++; });
        eventbus.on('clear-event', () => { count++; });
        eventbus.emit('clear-event');
        expect(count).toBe(2);

        eventbus.off('clear-event');
        eventbus.emit('clear-event');
        expect(count).toBe(2);
    });

    test('should remove listener automatically when signal is aborted', async () => {
        const controller = new AbortController();
        let count = 0;

        eventbus.on('abort-event', () => {
            count++;
        }, { signal: controller.signal });

        eventbus.emit('abort-event');
        expect(count).toBe(1);

        controller.abort();

        eventbus.emit('abort-event');
        expect(count).toBe(1);
    });

    test('should not register listener if signal is already aborted', async () => {
        const controller = new AbortController();
        controller.abort();
        let count = 0;

        eventbus.on('pre-aborted-event', () => {
            count++;
        }, { signal: controller.signal });

        eventbus.emit('pre-aborted-event');
        expect(count).toBe(0);
    });

    test('should support both once and signal options simultaneously', async () => {
        const controller = new AbortController();
        let count = 0;

        eventbus.once('once-signal-event', () => {
            count++;
        }, { signal: controller.signal });

        controller.abort();

        eventbus.emit('once-signal-event');
        expect(count).toBe(0);
    });

    test('should attach to universal globalThis.__gia_eventbus__ singleton for multi-bundle sharing', () => {
        expect(globalThis.__gia_eventbus__).toBeDefined();
        expect(eventbus).toBe(globalThis.__gia_eventbus__);
    });

    test('should handle emit with no listeners and emit without eventObject safely', async () => {
        // Zero listeners - should not throw
        expect(() => eventbus.emit('non-existent-event')).not.toThrow();

        // Listen without passing payload
        let received = null;
        eventbus.on('no-payload-event', (evt) => {
            received = evt;
        });
        eventbus.emit('no-payload-event');
        expect(received).toEqual({ _name: 'no-payload-event' });
    });

    test('should support wildcard colon prefix subscriptions (e.g. cart:*)', async () => {
        const events = [];
        const handler = (detail) => {
            events.push(detail._name);
        };

        eventbus.on('cart:*', handler);

        eventbus.emit('cart:add', { item: 'apple' });
        eventbus.emit('cart:remove', { item: 'apple' });
        eventbus.emit('user:login', { id: 123 });

        expect(events).toEqual(['cart:add', 'cart:remove']);

        // Test unregistering wildcard
        eventbus.off('cart:*', handler);
        eventbus.emit('cart:checkout');
        expect(events).toEqual(['cart:add', 'cart:remove']);
    });

    test('should support wildcard dot prefix subscriptions (e.g. store.*)', async () => {
        const events = [];
        const handler = (detail) => {
            events.push(detail._name);
        };

        eventbus.on('store.*', handler);

        eventbus.emit('store.item', { id: 1 });
        eventbus.emit('auth.login', { user: 'alex' });

        expect(events).toEqual(['store.item']);

        eventbus.off('store.*', handler);
    });

    test('should support global wildcard subscriptions (*)', async () => {
        const events = [];
        const handler = (detail) => {
            events.push(detail._name);
        };

        eventbus.on('*', handler);

        eventbus.emit('order:created');
        eventbus.emit('notify');

        expect(events).toEqual(['order:created', 'notify']);

        eventbus.off('*', handler);
        eventbus.emit('another');
        expect(events).toEqual(['order:created', 'notify']);
    });

    test('should support wildcard subscription with once: true', async () => {
        let count = 0;
        eventbus.once('metric:*', () => {
            count++;
        });

        eventbus.emit('metric:cpu');
        eventbus.emit('metric:memory');

        expect(count).toBe(1);
    });
});
