// Singleton state attached to window to prevent multiple instances of Gia from thrashing each other
const state = (typeof window !== 'undefined' ? window.__gia_scheduler__ : null) || {
    reads: [],
    writes: [],
    scheduled: false
};

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
if (typeof window !== 'undefined' && !window.__gia_scheduler__) {
    window.__gia_scheduler__ = state;
}

function getWrapper(fn, ctx) {
    let wrapper = state.wrapperPool.pop();
    if (!wrapper) {
        wrapper = function() {
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

    // Flush writes (Mutates)
    const currentWrites = state.writes;
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

    // If new tasks were scheduled during the flush, schedule another frame
    if (state.reads.length > 0 || state.writes.length > 0) {
        schedule();
    }
}

function schedule() {
    if (!state.scheduled && typeof window !== 'undefined') {
        state.scheduled = true;
        window.requestAnimationFrame(flush);
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

export function clear(task) {
    let index = state.reads.indexOf(task);
    if (index > -1) {
        const t = state.reads[index];
        if (t && t._isGiaWrapper) {
            t.fn = null;
            t.ctx = null;
            state.wrapperPool.push(t);
        }
        state.reads[index] = null;
        return true;
    }

    for (let i = 0; i < state.reads.length; i++) {
        const t = state.reads[i];
        if (t && t._isGiaWrapper && t.fn === task) {
            t.fn = null;
            t.ctx = null;
            state.wrapperPool.push(t);
            state.reads[i] = null;
            return true;
        }
    }
    
    index = state.writes.indexOf(task);
    if (index > -1) {
        const t = state.writes[index];
        if (t && t._isGiaWrapper) {
            t.fn = null;
            t.ctx = null;
            state.wrapperPool.push(t);
        }
        state.writes[index] = null;
        return true;
    }

    for (let i = 0; i < state.writes.length; i++) {
        const t = state.writes[i];
        if (t && t._isGiaWrapper && t.fn === task) {
            t.fn = null;
            t.ctx = null;
            state.wrapperPool.push(t);
            state.writes[i] = null;
            return true;
        }
    }
    
    return false;
}
