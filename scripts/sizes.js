/**
 * Writes the measured bundle sizes from dist/ into readme.md, so the documented sizes never
 * drift from the build.
 *
 *   node scripts/sizes.js          update readme.md
 *   node scripts/sizes.js --check  exit 1 when readme.md is out of date
 *
 * Sizes use kB = 1000 bytes and gzip level 9, the same figures `vite build` prints.
 */
const { readFileSync, writeFileSync } = require("node:fs");
const { gzipSync } = require("node:zlib");
const { join } = require("node:path");

const root = join(__dirname, "..");
const README = join(root, "readme.md");

const TIERS = ["full", "mini", "nano"];
const TITLES = { full: "Full Build", mini: "Mini Build", nano: "Nano Build" };

const kb = (bytes) => (bytes / 1000).toFixed(1);

/** { full: { umd: { raw, gz }, mjs: { raw, gz } }, ... } in bytes */
function measure(distDir = join(root, "dist")) {
	const sizes = {};
	for (const tier of TIERS) {
		sizes[tier] = {};
		for (const [format, ext] of [["umd", "umd.js"], ["mjs", "mjs"]]) {
			const code = readFileSync(join(distDir, `gia.${tier}.${ext}`));
			sizes[tier][format] = { raw: code.length, gz: gzipSync(code, { level: 9 }).length };
		}
	}
	return sizes;
}

function replaceOnce(text, pattern, replacement) {
	let count = 0;
	const result = text.replace(pattern, (...args) => {
		count++;
		return typeof replacement === "function" ? replacement(...args) : replacement;
	});
	if (count !== 1) throw new Error(`sizes: expected one match for ${pattern}, found ${count}`);
	return result;
}

/** Returns `readme` with every documented size set from `sizes`. */
function applySizes(readme, sizes) {
	// Smallest (nano ESM) to largest (full UMD) gzipped bundle
	const min = kb(sizes.nano.mjs.gz);
	const max = kb(sizes.full.umd.gz);
	const cell = ({ raw, gz }) => `~${kb(gz)} KB (${kb(raw)} KB)`;

	let out = readme;
	out = replaceOnce(out, /\(~[\d.]+KB to ~[\d.]+KB gzipped\)/g, `(~${min}KB to ~${max}KB gzipped)`);
	out = replaceOnce(out, /bundle%20size-\([\d.]+kb_to_[\d.]+kb_gzipped\)/g, `bundle%20size-(${min}kb_to_${max}kb_gzipped)`);
	out = replaceOnce(out, /Nano build \(~[\d.]+ KB gzipped\)/g, `Nano build (~${min} KB gzipped)`);
	for (const tier of TIERS) {
		// | **Full Build** | import | description | UMD cell | ESM cell |
		const row = new RegExp(`^(\\| \\*\\*${TITLES[tier]}\\*\\* \\|[^|]*\\|[^|]*\\|) [^|]* \\| [^|]* \\|$`, "gm");
		out = replaceOnce(out, row, (_m, head) => `${head} ${cell(sizes[tier].umd)} | ${cell(sizes[tier].mjs)} |`);
	}
	return out;
}

module.exports = { measure, applySizes };

if (require.main === module) {
	const readme = readFileSync(README, "utf8");
	const updated = applySizes(readme, measure());
	if (process.argv.includes("--check")) {
		if (updated !== readme) {
			console.error("readme.md bundle sizes are out of date: run `npm run sizes`");
			process.exit(1);
		}
	} else if (updated !== readme) {
		writeFileSync(README, updated);
		console.log("readme.md bundle sizes updated");
	}
}
