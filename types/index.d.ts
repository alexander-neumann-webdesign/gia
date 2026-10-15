/**
 * Global configuration options for Gia
 */
export interface GiaConfig {
	log: boolean;
	attrPrefix: string;
	autoMountComponents: boolean;
	autoBindActions: boolean;
}

/**
 * Configuration manager
 */
export interface ConfigManager {
	get<K extends keyof GiaConfig>(name: K): GiaConfig[K];
	get(name: string): any;
	set<K extends keyof GiaConfig>(name: K, value: GiaConfig[K]): void;
	set(name: string, value: any): void;
}

export const config: ConfigManager;

/**
 * Event bus listener options
 */
export interface EventBusListenerOptions {
	once?: boolean;
	signal?: AbortSignal;
}

/**
 * Zero-GC high-performance event bus
 */
export interface EventBus {
	listeners: Record<string, Function[]>;
	on(event: string, handler: (detail?: any) => void, options?: boolean | EventBusListenerOptions): void;
	once(event: string, handler: (detail?: any) => void, options?: EventBusListenerOptions): void;
	off(event: string, handler?: Function): void;
	emit(event: string, eventObject?: Record<string, any>): void;
}

export const eventbus: EventBus;

/**
 * DOM Scheduler functions for layout thrashing prevention
 */
export type ScheduledTask = Function;

export function measure(fn: (this: any) => void, ctx?: any): ScheduledTask;
export function mutate(fn: (this: any) => void, ctx?: any): ScheduledTask;
export function clear(task: ScheduledTask | Function): boolean;

/**
 * DOM and Functional Utilities
 */
export namespace utils {
	export function query<T extends Element = HTMLElement>(selector: string | T, context?: Element | Document): T | null;
	export function queryAll<T extends Element = HTMLElement>(
		selector: string | NodeList | T[],
		context?: Element | Document
	): NodeListOf<T> | T[];
	export function toggleClass(element: Element, className: string, condition?: boolean | null): void;
	export function addClass<T extends Element | Element[] | NodeList>(nodes: T, className: string): T;
	export function removeClass<T extends Element | Element[] | NodeList>(nodes: T, className: string): T;
	export function triggerEvent(
		element: Element,
		eventType: string,
		params?: any,
		options?: { bubbles?: boolean; cancelable?: boolean; detail?: any }
	): void;
	export function debounce<T extends (...args: any[]) => any>(
		func: T,
		wait: number
	): ((...args: Parameters<T>) => void) & { cancel(): void };
}

/**
 * Scroll callback data structure
 */
export interface ScrollData {
	scroll: number;
	velocity: number;
}

/**
 * Window dimensions data structure
 */
export interface WindowDimensions {
	width: number;
	height: number;
}

/**
 * Base Component class providing core lifecycle, refs, options, observers, and state.
 */
export class BaseComponent<
	TState extends Record<string, any> = Record<string, any>,
	TOptions extends Record<string, any> = Record<string, any>,
	TRef extends Record<string, any> = Record<string, any>
> {
	constructor(element: Element, options?: TOptions);

	element: Element | null;
	readonly isMounted: boolean;
	readonly signal: AbortSignal | null;
	ref: TRef;
	options: TOptions;
	state: TState;

	mount(): void | (() => void);
	unmount(): void;

	getRef(ref: string, prefixed?: boolean): string;
	setState(
		changes: Partial<TState> | ((prevState: Readonly<TState>) => Partial<TState>)
	): void;
	stateChange(stateChanges: Partial<TState>): void | Partial<TState>;

	observeScroll(callback: (scrollData: ScrollData) => void): void;
	unobserveScroll(callback: (scrollData: ScrollData) => void): void;

	observeWindowResize(callback: (dimensions: WindowDimensions) => void): void;
	unobserveWindowResize(callback: (dimensions: WindowDimensions) => void): void;

	observeResize(element: Element, callback: (entry: ResizeObserverEntry) => void): void;
	unobserveResize(element: Element, callback?: ((entry: ResizeObserverEntry) => void) | null): void;

	observeIntersection(
		element: Element,
		callback: (entry: IntersectionObserverEntry) => void,
		options?: IntersectionObserverInit
	): void;
	unobserveIntersection(
		element: Element,
		callback?: ((entry: IntersectionObserverEntry) => void) | null
	): void;

	loadScript(scriptId: string, globalName?: string): Promise<any>;
	loadStyle(styleId: string): Promise<boolean>;
}

/**
 * Component with asynchronous code-splitting support
 */
export class Component<
	TState extends Record<string, any> = Record<string, any>,
	TOptions extends Record<string, any> = Record<string, any>,
	TRef extends Record<string, any> = Record<string, any>
> extends BaseComponent<TState, TOptions, TRef> {
	require(): Promise<any> | void;
}

/**
 * Component constructor type
 */
export type ComponentConstructor<T extends BaseComponent = BaseComponent> = {
	new (element: Element, options?: any): T;
	priority?: number;
	_gia_priority?: number;
};

/**
 * Initializes and mounts components found within the DOM context.
 * Can be called with (components, context), or (context) to mount globally registered components,
 * or () to mount globally registered components across document.documentElement.
 */
export function loadComponents(
	components?: Record<string, ComponentConstructor> | Element | Document,
	context?: Element | Document
): void;

/**
 * Registers a component class with optional mounting priority
 */
export function register(
	ComponentClass: ComponentConstructor,
	options?: { priority?: number }
): void;

/**
 * Instantiates a component on a DOM element
 */
export function createInstance<T extends BaseComponent = BaseComponent>(
	element: Element,
	componentName: string,
	component: ComponentConstructor<T>,
	options?: any
): T | null;

/**
 * Destroys all component instances within the context
 */
export function removeComponents(context?: Element | Document): void;

/**
 * Destroys a component instance associated with an element or element ID
 */
export function destroyInstance(element: Element | string): void;

/**
 * Retrieves the component instance associated with an element or element ID
 */
export function getComponentFromElement<T extends BaseComponent = BaseComponent>(
	element: Element | string
): T | null;

declare global {
	interface Window {
		gia?: {
			components?: Record<string, ComponentConstructor>;
			register?: (ComponentClass: ComponentConstructor, options?: { priority?: number }) => void;
		};
		__gia_scheduler__?: {
			reads: Function[];
			writes: Function[];
			scheduled: boolean;
			currentReads: Function[] | null;
			currentWrites: Function[] | null;
			tempReads?: Function[];
			tempWrites?: Function[];
			wrapperPool?: Function[];
		};
		__gia_store__?: WeakMap<Element, BaseComponent>;
		lenis?: any;
	}
}

