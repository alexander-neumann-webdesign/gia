/**
 * Micro-benchmarks for Gia's hot paths, run against the built bundles in headless Chromium.
 *
 *   npm run build && npm run bench
 *   GIA_CHROMIUM=/path/to/chrome npm run bench   use a specific browser binary
 *
 * Each scenario runs in a fresh page per bundle and reports the median of several rounds, so
 * compare numbers from the same machine only.
 */
const { chromium } = require("@playwright/test");
const { join } = require("node:path");

const ROUNDS = 7;

// Runs inside the page. `gia` is window.gia from the bundle under test.
const SCENARIOS = {
	"eventbus emit (5 listeners, 200k emits)": async (gia) => {
		const bus = gia.eventbus;
		let n = 0;
		const handlers = [];
		for (let i = 0; i < 5; i++) handlers.push(() => n++);
		for (const h of handlers) bus.on("bench:tick", h);
		const payload = { value: 1 };
		const t0 = performance.now();
		for (let i = 0; i < 200000; i++) bus.emit("bench:tick", payload);
		const t = performance.now() - t0;
		for (const h of handlers) bus.off("bench:tick", h);
		return t;
	},

	"mount + unmount 1000 components": async (gia) => {
		const Base = gia.BaseComponent;
		class BenchItem extends Base {
			constructor(el) {
				super(el);
				this.ref = { label: null, buttons: [] };
				this.options = { size: 1, active: false };
			}
			mount() {}
			onClick() {}
			onHover() {}
			render() {}
			update() {}
		}
		const root = document.createElement("div");
		root.innerHTML = '<div data-component="BenchItem"><span data-ref="label"></span><button data-ref="buttons"></button><button data-ref="buttons"></button></div>'.repeat(1000);
		document.body.appendChild(root);
		const t0 = performance.now();
		gia.loadComponents({ BenchItem }, root);
		gia.removeComponents(root);
		const t = performance.now() - t0;
		root.remove();
		return t;
	},

	"setState + flush on 1000 components": async (gia) => {
		const Base = gia.BaseComponent;
		class BenchState extends Base {
			stateChange() {}
		}
		const root = document.createElement("div");
		root.innerHTML = '<div data-component="BenchState"></div>'.repeat(1000);
		document.body.appendChild(root);
		gia.loadComponents({ BenchState }, root);
		const instances = Array.from(root.children, (el) => gia.getComponentFromElement(el));
		let total = 0;
		for (let round = 0; round < 10; round++) {
			const t0 = performance.now();
			for (let i = 0; i < instances.length; i++) {
				instances[i].setState({ count: round, isOpen: round % 2 === 0, label: "x" + round });
			}
			total += performance.now() - t0;
			// Reads run right before writes in the same frame: time only the flush, not the frame wait
			let flushStart = 0;
			gia.measure(() => (flushStart = performance.now()));
			await new Promise((resolve) => gia.mutate(resolve));
			total += performance.now() - flushStart;
		}
		gia.removeComponents(root);
		root.remove();
		return total;
	},

	"autoMount: remove 2000 plain elements (one at a time)": async (gia) => {
		if (!gia.config || !("loadComponents" in gia)) return null;
		gia.config.set("autoMountComponents", true);
		const root = document.createElement("div");
		root.innerHTML = "<p><b>x</b> y</p>".repeat(2000);
		document.body.appendChild(root);
		await Promise.resolve();
		const t0 = performance.now();
		while (root.firstChild) root.firstChild.remove();
		// MutationObserver callbacks run as a microtask queued before this one resolves
		await Promise.resolve();
		const t = performance.now() - t0;
		root.remove();
		gia.config.set("autoMountComponents", false);
		return t;
	},
};

async function run() {
	const browser = await chromium.launch({ executablePath: process.env.GIA_CHROMIUM || undefined });
	const bundles = ["full", "mini", "nano"];
	const results = {};
	for (const name of Object.keys(SCENARIOS)) results[name] = {};

	for (const bundle of bundles) {
		for (const [name, fn] of Object.entries(SCENARIOS)) {
			if (bundle === "nano" && name.startsWith("eventbus")) continue;
			if (bundle !== "full" && name.startsWith("autoMount")) continue;
			const times = [];
			for (let round = 0; round < ROUNDS; round++) {
				const page = await browser.newPage();
				await page.setContent("<!doctype html><html><body></body></html>");
				await page.addScriptTag({ path: join(__dirname, `../dist/gia.${bundle}.umd.js`) });
				times.push(await page.evaluate(`(${fn.toString()})(window.gia)`));
				await page.close();
			}
			times.sort((a, b) => a - b);
			results[name][bundle] = times[Math.floor(times.length / 2)];
		}
	}
	await browser.close();

	const pad = (s, n) => String(s).padEnd(n);
	console.log(pad("scenario (median ms)", 56) + bundles.map((b) => pad(b, 10)).join(""));
	for (const [name, byBundle] of Object.entries(results)) {
		const cells = bundles.map((b) => pad(byBundle[b] == null ? "-" : byBundle[b].toFixed(2), 10));
		console.log(pad(name, 56) + cells.join(""));
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
