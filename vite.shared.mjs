import { minify } from "terser";

/**
 * Custom Terser plugin for Vite library mode.
 *
 * Vite skips whitespace and structural minification for ES module outputs (.mjs)
 * in library mode. This plugin processes all final emitted chunks in generateBundle,
 * applying aggressive multi-pass Terser compression, dead-code elimination,
 * constant folding, and full whitespace stripping.
 */
export function terserPlugin(customOptions = {}) {
	return {
		name: "gia-terser",
		enforce: "post",
		apply: "build",
		async generateBundle(outputOptions, bundle) {
			for (const fileName of Object.keys(bundle)) {
				const chunk = bundle[fileName];
				if (chunk.type === "chunk" && (fileName.endsWith(".mjs") || fileName.endsWith(".js"))) {
					const isModule = fileName.endsWith(".mjs");
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
							pure_funcs: ["console.info", "console.warn"],
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
 * Preserves critical singleton handles on window and DOM elements.
 */
export const sharedEsbuildOptions = {
	mangleProps: /^_/,
	reserveProps: /^(__gia_component__|__gia_scheduler__|__gia_store__|__gia_eventbus__)$/,
	mangleQuoted: false,
	legalComments: "none",
};

/**
 * Shared Rollup options for library builds.
 * Sets extend: true so UMD builds merge onto globalThis.gia rather than overwriting it.
 */
export const sharedRollupOptions = {
	output: {
		extend: true,
		exports: "named",
		compact: true,
		generatedCode: {
			constBindings: true,
		},
	},
};

