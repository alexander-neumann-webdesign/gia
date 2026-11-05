import { minify } from "terser";

/**
 * UMD global the factory writes its exports to. The merge footer below moves them onto
 * window.gia, so Rollup never assigns onto window.gia directly.
 */
export const UMD_STAGING_GLOBAL = "__gia_umd__";

/** Capability rank per build tier: when several UMD bundles share a page, the highest wins. */
export const UMD_RANK = { full: 3, mini: 2, nano: 1 };

/**
 * Footer appended to UMD files only. In the browser-global branch the factory has written the
 * exports to globalThis.__gia_umd__; merge them onto globalThis.gia:
 * - a bundle with a higher rank than the current owner replaces every export it provides,
 * - an equal or lower rank only fills in names that are still missing (first wins on ties),
 * so an embedded mini/nano widget can never downgrade a page that already loaded the full build.
 * Registered components (gia.components) are never touched. In the CommonJS/AMD branches the
 * staging global is never set and the footer does nothing.
 */
function umdMergeFooter(rank) {
	return `
;(function (g) {
	var incoming = g.${UMD_STAGING_GLOBAL};
	if (!incoming) return;
	delete g.${UMD_STAGING_GLOBAL};
	var gia = g.gia || (g.gia = {});
	var TIER = Symbol.for("gia.tier");
	var overwrite = ${rank} > (gia[TIER] || 0);
	for (var key in incoming) {
		if (overwrite || !(key in gia)) gia[key] = incoming[key];
	}
	if (overwrite) Object.defineProperty(gia, TIER, { value: ${rank}, configurable: true, writable: true });
})(typeof globalThis !== "undefined" ? globalThis : self);
`;
}

/**
 * Custom Terser plugin for Vite library mode.
 *
 * Vite skips whitespace and structural minification for ES module outputs (.mjs)
 * in library mode. This plugin processes all final emitted chunks in generateBundle,
 * applying aggressive multi-pass Terser compression, dead-code elimination,
 * constant folding, and full whitespace stripping.
 */
export function terserPlugin(customOptions = {}) {
	const { umdRank, ...terserOptions } = customOptions;
	customOptions = terserOptions;
	return {
		name: "gia-terser",
		enforce: "post",
		apply: "build",
		async generateBundle(outputOptions, bundle) {
			for (const fileName of Object.keys(bundle)) {
				const chunk = bundle[fileName];
				if (chunk.type === "chunk" && (fileName.endsWith(".mjs") || fileName.endsWith(".js"))) {
					const isModule = fileName.endsWith(".mjs");
					if (outputOptions.format === "umd") {
						if (!umdRank) throw new Error("gia-terser: umdRank is required for UMD builds");
						chunk.code += umdMergeFooter(umdRank);
					}
					const minified = await minify(chunk.code, {
						ecma: 2020,
						module: isModule,
						toplevel: true,
						compress: {
							passes: 4,
							unsafe: true,
							unsafe_arrows: true,
							unsafe_methods: true,
							unsafe_comps: true,
							pure_getters: true,
							drop_debugger: true,
							inline: 3,
							reduce_vars: true,
							collapse_vars: true,
							hoist_funs: true,
							typeofs: false,
							...customOptions.compress,
						},
						format: {
							comments: false,
							wrap_func_args: false,
							ascii_only: true,
							...customOptions.format,
						},
						mangle: {
							toplevel: true,
							...customOptions.mangle,
						},
					});
					if (minified?.code) {
						chunk.code = minified.code;
					}
				}
			}
		},
	};
}

/**
 * Shared esbuild options for fast AST-level property mangling.
 *
 * Mangled names differ between build tiers and versions, so every property that one bundle
 * reads or calls on an object created by ANOTHER bundle must be reserved:
 * - global singleton handles (__gia_*__) and the UMD staging global (__gia_umd__)
 * - the instance lifecycle protocol used by loadComponents/destroyInstance/createInstance
 *   (_load, _destroy) plus _name and the static _gia_priority
 * - shared event bus state that a full bundle adopts from a mini bus (_listeners), the
 *   once-wrapper lookup on user handlers (_wrappedHandlers) and the wrapper's back-reference to
 *   its handler (_onceHandler)
 * - the in-flight promise cached on <script>/<link> tags by loadScript/loadStyle (_loadPromise)
 */
export const sharedEsbuildOptions = {
	mangleProps: /^_/,
	reserveProps: /^(__gia_umd__|__gia_component__|_gia_component|__gia_scheduler__|__gia_store__|__gia_eventbus__|__gia_config__|__gia_automount__|_gia_priority|_name|_load|_destroy|_listeners|_wrappedHandlers|_onceHandler|_loadPromise)$/,
	mangleQuoted: false,
	legalComments: "none",
};

/**
 * Shared Rollup options for library builds.
 * UMD exports go to a fresh staging object (extend: false); umdMergeFooter merges them onto
 * globalThis.gia by build tier.
 */
export const sharedRollupOptions = {
	output: {
		extend: false,
		exports: "named",
		compact: true,
		generatedCode: {
			constBindings: true,
		},
	},
};

