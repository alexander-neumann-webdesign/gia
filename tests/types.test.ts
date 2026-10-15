import {
	BaseComponent,
	Component,
	loadComponents,
	createInstance,
	removeComponents,
	destroyInstance,
	getComponentFromElement,
	eventbus,
	config,
	utils,
	measure,
	mutate,
	clear,
	register,
} from 'gia';

import {
	BaseComponent as NanoBaseComponent,
	loadComponents as nanoLoadComponents,
	register as nanoRegister,
} from 'gia/nano';

interface CounterState {
	count: number;
}

interface CounterOptions {
	initialCount: number;
}

interface CounterRef {
	btn: HTMLButtonElement;
	items: HTMLElement[];
}

class Counter extends BaseComponent<CounterState, CounterOptions, CounterRef> {
	mount() {
		// Validating types
		const isMounted: boolean = this.isMounted;
		const signal: AbortSignal | null = this.signal;
		const options: CounterOptions = this.options;
		const state: CounterState = this.state;

		this.setState({ count: 1 });

		// Test listen helper
		this.listen('click', () => {});
		this.listen(window, 'resize', () => {});

		// Test mount cleanup return
		return () => {
			// Teardown
		};
	}

	stateChange(changes: Partial<CounterState>) {
		if (changes.count !== undefined) {
			const c: number = changes.count;
		}
	}
}

class AsyncCounter extends Component<CounterState, CounterOptions, CounterRef> {
	async require() {
		await this.loadScript('vendor-lib', 'VendorLib');
	}

	mount() {
		return () => {};
	}
}

// EventBus with AbortSignal test
const controller = new AbortController();
eventbus.on('test', (data) => {}, { signal: controller.signal, once: true });
eventbus.once('once-test', (data) => {}, { signal: controller.signal });
eventbus.off('test');

// Scheduler tests
const task = measure(() => {});
mutate(() => {});
clear(task);

// Utils tests
const el = utils.query<HTMLDivElement>('#app');
const list = utils.queryAll<HTMLSpanElement>('.item');
const debounced = utils.debounce((val: string) => {}, 100);
debounced('hello');
debounced.cancel();

// Nano tests
class MinimalComp extends NanoBaseComponent {
	mount() {}
}

register(Counter, { priority: 10 });
nanoRegister(MinimalComp);
loadComponents();
loadComponents(document.body);
loadComponents({
	Counter,
	LazyCounter: () => Promise.resolve(Counter),
});
nanoLoadComponents(document.body);

