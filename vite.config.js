import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	define: {
		__GIA_MINI__: "false"
	},
	esbuild: {
		mangleProps: /^_/,
		reserveProps: /^__gia_component__$/,
		mangleQuoted: false,
		legalComments: 'none',
	},
	build: {
		lib: {
			entry: resolve(__dirname, "lib/main.js"),
			name: "gia",
			fileName: (format) => `gia.full.${format === 'es' ? 'mjs' : 'umd.js'}`,
		},
	},
});









