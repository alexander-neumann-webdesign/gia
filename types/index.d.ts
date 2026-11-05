/**
 * Global configuration options for Gia
 */
export interface GiaConfig {
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
 * Event bus channel interface
 */
export interface EventBusChannel {
	emit(event: string, eventObject?: Record<string, any>): void;
	on(event: string, handler: (detail?: any) => void, options?: boolean | EventBusListenerOptions): void;
	once(event: string, handler: (detail?: any) => void, options?: EventBusListenerOptions): void;
	off(event: string, handler?: Function): void;
}

/**
 * Zero-GC high-performance event bus
 */
export interface EventBus {
	on(event: string, handler: (detail?: any) => void, options?: boolean | EventBusListenerOptions): void;
	once(event: string, handler: (detail?: any) => void, options?: EventBusListenerOptions): void;
	off(event: string, handler?: Function): void;
	emit(event: string, eventObject?: Record<string, any>): void;
	channel(namespace: string): EventBusChannel;
}

export const eventbus: EventBus;

/**
 * Intersection observer options supporting once
 */
export interface GiaIntersectionObserverInit extends IntersectionObserverInit {
	once?: boolean;
}

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
	export function throttle<T extends (...args: any[]) => any>(
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
	/** Current state. Read-only: change it with setState(), which batches updates and calls stateChange(). */
	readonly state: TState;

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

	/**
	 * Calls `callback` with a one-entry array (`([entry]) => ...`). The array is reused between
	 * calls: read it synchronously and do not keep a reference to it.
	 */
	observeResize(element: Element, callback: (entries: ResizeObserverEntry[]) => void): void;
	unobserveResize(element: Element, callback?: ((entries: ResizeObserverEntry[]) => void) | null): void;

	/**
	 * Calls `callback` with a one-entry array (`([entry]) => ...`). The array is reused between
	 * calls: read it synchronously and do not keep a reference to it.
	 */
	observeIntersection(
		element: Element,
		callback: (entries: IntersectionObserverEntry[]) => void,
		options?: GiaIntersectionObserverInit
	): void;
	unobserveIntersection(
		element: Element,
		callback?: ((entries: IntersectionObserverEntry[]) => void) | null
	): void;

	observeMediaQuery(query: string, callback: (matches: boolean, mql: MediaQueryList) => void): () => void;
	unobserveMediaQuery(query: string, callback?: ((matches: boolean, mql: MediaQueryList) => void) | null): void;

	/**
	 * Loads a script by tag ID (falls back to ID + "-js", as WordPress names enqueued scripts) or URL.
	 * Resolves with `window[globalName]` when given, otherwise `true`.
	 */
	loadScript(scriptId: string, globalName?: string): Promise<any>;
	/** Loads a stylesheet by tag ID (falls back to ID + "-css", as WordPress names enqueued styles) or URL. */
	loadStyle(styleId: string): Promise<boolean>;

	listen(
		target: EventTarget,
		event: string,
		handler: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions
	): () => void;
	listen(
		event: string,
		handler: EventListenerOrEventListenerObject,
		options?: boolean | AddEventListenerOptions
	): () => void;

	delegate<T extends Element = Element>(
		selector: string,
		event: string,
		handler: ((this: this, event: Event, target: T) => void) | string,
		options?: boolean | AddEventListenerOptions
	): () => void;
	find<T extends Element = HTMLElement>(selector: string): T | null;
	findAll<T extends Element = HTMLElement>(selector: string): T[];

	toggleClass<T extends Element = HTMLElement>(
		target: string | Element,
		className: string,
		condition?: boolean | null
	): T | null;
	toggleClass<T extends Element = HTMLElement>(className: string, condition?: boolean | null): T | null;

	addClass<T extends Element = HTMLElement>(target: string | Element, className?: string): T | null;
	removeClass<T extends Element = HTMLElement>(target: string | Element, className?: string): T | null;

	updateRefs(): void;
	emit(event: string, eventObject?: Record<string, any>): void;
	on(event: string, handler: (detail?: any) => void, options?: boolean | EventBusListenerOptions): void;
	channel(namespace: string): EventBusChannel;
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
 * Component loader supporting synchronous constructors and dynamic imports (() => import(...))
 */
export type ComponentLoader<T extends BaseComponent = BaseComponent> =
	| ComponentConstructor<T>
	| ((element?: Element) => Promise<{ default: ComponentConstructor<T> } | ComponentConstructor<T>> | ComponentConstructor<T>);

/**
 * Initializes and mounts components found within the DOM context.
 * Can be called with (components, context), or (context) to mount globally registered components,
 * or () to mount globally registered components across document.documentElement.
 */
export function loadComponents(
	components?: Record<string, ComponentLoader> | Element | Document,
	context?: Element | Document
): void;

/**
 * Registers a component class in window.gia.components with optional mounting priority.
 * `name` defaults to the class name; pass it explicitly when your production build minifies
 * class names (otherwise data-component="Header" will not find the renamed class).
 */
export function register(
	ComponentClass: ComponentConstructor,
	options?: { priority?: number; name?: string }
): void;

/**
 * Instantiates and mounts a component on a DOM element (a Component mounts once require() resolves).
 * Returns the existing instance if the element already has one, or null if construction failed.
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
			register?: (ComponentClass: ComponentConstructor, options?: { priority?: number; name?: string }) => void;
		};
		__gia_scheduler__?: {
			reads: Function[];
			writes: Function[];
			scheduled: boolean;
			currentReads: Function[] | null;
			currentWrites: Function[] | null;
			tempReads?: Function[];
			tempWrites?: Function[];
		};
		__gia_store__?: WeakMap<Element, BaseComponent>;
		lenis?: any;
	}
}

