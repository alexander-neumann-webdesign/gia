// Singleton state attached to window/globalThis to prevent multiple instances of Gia from thrashing each other
const globalObj =
	typeof globalThis !== "undefined"
		? globalThis
		: typeof window !== "undefined"
		? window
		: typeof global !== "undefined"
		? global
		: {};

const state = globalObj.__gia_scheduler__ || (globalObj.__gia_scheduler__ = {
	reads: [],
	writes: [],
	scheduled: false,
	currentReads: null,
	currentWrites: null,
	tempReads: [],
	tempWrites: [],
});

if (!state.tempReads) {
	state.tempReads = [];
}
if (!state.tempWrites) {
	state.tempWrites = [];
}

// Store on window if we are in a browser environment and it isn't already there
if (typeof window !== "undefined" && !window.__gia_scheduler__) {
	window.__gia_scheduler__ = state;
}

// Each context-bound task gets its own wrapper. Wrappers are deliberately NOT pooled: the
// wrapper is the handle returned to the caller, and recycling it would let a stale clear(handle)
// cancel an unrelated task that later reused the same object.
function getWrapper(fn, ctx) {
	const wrapper = function () {
		fn.call(ctx);
	};
	wrapper.fn = fn;
	return wrapper;
}

function flush() {
	state.scheduled = false;

	// Flush reads (Measures)
	const currentReads = state.reads;
	state.currentReads = currentReads;
	state.reads = state.tempReads;

	for (let i = 0; i < currentReads.length; i++) {
		const task = currentReads[i];
		if (task) {
			try {
				task();
			} catch (e) {
				console.error(e);
			}
		}
	}

	currentReads.length = 0;
	state.tempReads = currentReads;
	state.currentReads = null;

	// Flush writes (Mutates)
	const currentWrites = state.writes;
	state.currentWrites = currentWrites;
	state.writes = state.tempWrites;

	for (let i = 0; i < currentWrites.length; i++) {
		const task = currentWrites[i];
		if (task) {
			try {
				task();
			} catch (e) {
				console.error(e);
			}
		}
	}

	currentWrites.length = 0;
	state.tempWrites = currentWrites;
	state.currentWrites = null;

	// If new tasks were scheduled during the flush, schedule another frame
	if (state.reads.length > 0 || state.writes.length > 0) {
		schedule();
	}
}

function schedule() {
	if (typeof window !== "undefined") {
		if (!window.__gia_scheduler__) {
			window.__gia_scheduler__ = state;
		}
		if (!state.scheduled) {
			state.scheduled = true;
			window.requestAnimationFrame(flush);
		}
	}
}

export function measure(fn, ctx) {
	const task = ctx ? getWrapper(fn, ctx) : fn;
	state.reads.push(task);
	schedule();
	return task;
}

export function mutate(fn, ctx) {
	const task = ctx ? getWrapper(fn, ctx) : fn;
	state.writes.push(task);
	schedule();
	return task;
}

function _clearFromList(list, task) {
	if (!list || typeof task !== "function") return false;
	const index = list.indexOf(task);
	if (index > -1) {
		list[index] = null;
		return true;
	}

	// Allow clear(originalFn) for tasks scheduled with a context
	for (let i = 0; i < list.length; i++) {
		const t = list[i];
		if (t && t.fn === task) {
			list[i] = null;
			return true;
		}
	}

	return false;
}

export function clear(task) {
	return (
		_clearFromList(state.reads, task) ||
		_clearFromList(state.writes, task) ||
		_clearFromList(state.currentReads, task) ||
		_clearFromList(state.currentWrites, task)
	);
}
