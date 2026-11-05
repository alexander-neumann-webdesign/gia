import { test, expect } from '@playwright/test';
import eventbus from '../src/eventbus';

test.describe('EventBus', () => {
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

    test('should support namespaced channels via eventbus.channel()', async () => {
        const cart = eventbus.channel('cart');
        const items = [];
        const handler = (data) => {
            items.push(data.id);
        };

        cart.on('add', handler);
        cart.emit('add', { id: 101 });
        cart.emit('add', { id: 102 });

        expect(items).toEqual([101, 102]);

        cart.off('add', handler);
        cart.emit('add', { id: 103 });
        expect(items).toEqual([101, 102]);
    });

    test('channel once should trigger only once', async () => {
        const auth = eventbus.channel('auth');
        let loggedIn = 0;
        auth.once('login', () => {
            loggedIn++;
        });

        auth.emit('login', { user: 'test' });
        auth.emit('login', { user: 'test' });
        expect(loggedIn).toBe(1);
    });


    test('off() removes a plain listener for a handler whose earlier once() already fired', async () => {
        let count = 0;
        const handler = () => { count++; };

        eventbus.once('once-then-on', handler);
        eventbus.emit('once-then-on'); // fires and removes the once() wrapper
        expect(count).toBe(1);

        eventbus.on('once-then-on', handler);
        eventbus.off('once-then-on', handler);
        eventbus.emit('once-then-on');

        expect(count).toBe(1);
        expect(handler._wrappedHandlers['once-then-on']).toBeUndefined();
    });

    test('off() removes a plain listener for a handler whose earlier once() was aborted', async () => {
        let count = 0;
        const handler = () => { count++; };
        const ac = new AbortController();

        eventbus.once('aborted-once', handler, { signal: ac.signal });
        ac.abort();

        eventbus.on('aborted-once', handler);
        eventbus.off('aborted-once', handler);
        eventbus.emit('aborted-once');

        expect(count).toBe(0);
    });

    test('off() still removes a pending once() wrapper', async () => {
        let count = 0;
        const handler = () => { count++; };

        eventbus.once('pending-once', handler);
        eventbus.off('pending-once', handler);
        eventbus.emit('pending-once');

        expect(count).toBe(0);
    });


    test('a frozen payload is delivered as is instead of throwing', async () => {
        const payload = Object.freeze({ id: 7 });
        let received = null;
        let wildcard = null;
        eventbus.on('frozen:event', (d) => { received = d; });
        eventbus.on('frozen:*', (d) => { wildcard = d; });

        expect(() => eventbus.emit('frozen:event', payload)).not.toThrow();
        expect(received).toBe(payload);
        expect(wildcard).toBe(payload);

        eventbus.off('frozen:event');
        eventbus.off('frozen:*');
    });

    test('extensible payloads are still tagged with _name', async () => {
        const payload = { id: 1 };
        let received = null;
        const handler = (d) => { received = d; };
        eventbus.on('tagged', handler);
        eventbus.emit('tagged', payload);
        expect(received).toBe(payload);
        expect(payload._name).toBe('tagged');
        eventbus.off('tagged', handler);
    });

    test('off() removes each once() registration of the same handler in turn', async () => {
        let count = 0;
        const handler = () => { count++; };
        eventbus.once('twice-once', handler);
        eventbus.once('twice-once', handler);

        eventbus.off('twice-once', handler);
        eventbus.emit('twice-once');
        expect(count).toBe(1); // one registration left, like on() twice + off() once

        eventbus.once('twice-once', handler);
        eventbus.once('twice-once', handler);
        eventbus.off('twice-once', handler);
        eventbus.off('twice-once', handler);
        eventbus.emit('twice-once');
        expect(count).toBe(1);
    });

    test('off() prefers a once() wrapper over a plain registration of the same handler', async () => {
        let count = 0;
        const handler = () => { count++; };
        eventbus.on('mixed', handler);
        eventbus.once('mixed', handler);
        eventbus.off('mixed', handler); // removes the once() wrapper

        eventbus.emit('mixed');
        eventbus.emit('mixed');
        expect(count).toBe(2); // the plain listener keeps firing
        eventbus.off('mixed', handler);
    });
});
