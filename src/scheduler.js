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
	wrapperPool: [],
});

if (!state.tempReads) {
	state.tempReads = [];
}
if (!state.tempWrites) {
	state.tempWrites = [];
}
if (!state.wrapperPool) {
	state.wrapperPool = [];
}

// Store on window if we are in a browser environment and it isn't already there
if (typeof window !== "undefined" && !window.__gia_scheduler__) {
	window.__gia_scheduler__ = state;
}

function getWrapper(fn, ctx) {
	let wrapper = state.wrapperPool.pop();
	if (!wrapper) {
		wrapper = function () {
			wrapper.fn.call(wrapper.ctx);
		};
		wrapper._isGiaWrapper = true;
	}
	wrapper.fn = fn;
	wrapper.ctx = ctx;
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
			if (task._isGiaWrapper) {
				task.fn = null;
				task.ctx = null;
				state.wrapperPool.push(task);
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
			if (task._isGiaWrapper) {
				task.fn = null;
				task.ctx = null;
				state.wrapperPool.push(task);
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
	if (!list) return false;
	const index = list.indexOf(task);
	if (index > -1) {
		const t = list[index];
		if (t && t._isGiaWrapper) {
			t.fn = null;
			t.ctx = null;
			state.wrapperPool.push(t);
		}
		list[index] = null;
		return true;
	}

	for (let i = 0; i < list.length; i++) {
		const t = list[i];
		if (t && t._isGiaWrapper && t.fn === task) {
			t.fn = null;
			t.ctx = null;
			state.wrapperPool.push(t);
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
