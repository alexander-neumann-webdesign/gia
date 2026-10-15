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
});
