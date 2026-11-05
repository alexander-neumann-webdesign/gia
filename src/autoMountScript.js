// A module <script> that loads a Gia ESM bundle directly, e.g. <script type="module"
// src="/dist/gia.full.mjs" data-auto-mount>; the tier is checked separately
const ESM_BUNDLE = /\/gia\.(full|mini|nano)\.mjs(?:[?#]|$)/;

/**
 * True when the <script> tag that loaded this bundle carries data-auto-mount.
 * - Classic scripts (the UMD builds): document.currentScript is that tag while it runs.
 * - ES modules have no currentScript. Only a module tag that loads this tier's Gia ESM file counts,
 *   so the attribute on any other script (another Gia bundle's tag, an unrelated library's, or the
 *   app bundle that imports Gia) never switches this copy on.
 * @param {string} tier - "full", "mini" or "nano"
 */
export function requestedAutoMount(tier) {
	if (typeof document === "undefined") return false;
	const own = document.currentScript;
	if (own) return own.hasAttribute("data-auto-mount");
	const tags = document.querySelectorAll("script[type=module][data-auto-mount][src]");
	for (let i = 0; i < tags.length; i++) {
		const match = ESM_BUNDLE.exec(tags[i].src);
		if (match && match[1] === tier) return true;
	}
	return false;
}
