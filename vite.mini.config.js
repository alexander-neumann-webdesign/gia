import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	define: {
		__GIA_MINI__: "true"
	},
	esbuild: {
		mangleProps: /^_/,
		reserveProps: /^__gia_component__$/,
		mangleQuoted: false,
	},
	build: {
		emptyOutDir: false, // Don't wipe the main build files
		lib: {
			entry: resolve(__dirname, "lib/main.js"),
			name: "gia",
			fileName: (format) => `gia.mini.${format === 'es' ? 'mjs' : 'umd.js'}`
		},
	},
});

