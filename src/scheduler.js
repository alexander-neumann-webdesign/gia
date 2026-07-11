// Singleton state attached to window to prevent multiple instances of Gia from thrashing each other
const state = (typeof window !== 'undefined' ? window.__gia_scheduler__ : null) || {
    reads: [],
    writes: [],
    scheduled: false
};

// Store on window if we are in a browser environment and it isn't already there
if (typeof window !== 'undefined' && !window.__gia_scheduler__) {
    window.__gia_scheduler__ = state;
}

function flush() {
    state.scheduled = false;

    // Flush reads (Measures)
    const currentReads = state.reads;
    state.reads = [];
    for (let i = 0; i < currentReads.length; i++) {
        try {
            currentReads[i]();
        } catch (e) {
            console.error(e);
        }
    }

    // Flush writes (Mutates)
    const currentWrites = state.writes;
    state.writes = [];
    for (let i = 0; i < currentWrites.length; i++) {
        try {
            currentWrites[i]();
        } catch (e) {
            console.error(e);
        }
    }

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
    const task = ctx ? fn.bind(ctx) : fn;
    state.reads.push(task);
    schedule();
    return task;
}

export function mutate(fn, ctx) {
    const task = ctx ? fn.bind(ctx) : fn;
    state.writes.push(task);
    schedule();
    return task;
}

export function clear(task) {
    let index = state.reads.indexOf(task);
    if (index > -1) {
        state.reads.splice(index, 1);
        return true;
    }
    
    index = state.writes.indexOf(task);
    if (index > -1) {
        state.writes.splice(index, 1);
        return true;
    }
    
    return false;
}
