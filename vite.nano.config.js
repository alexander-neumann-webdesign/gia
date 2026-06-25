import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
	define: {
		__GIA_MINI__: "true",
		__GIA_NANO__: "true"
	},
	esbuild: {
		mangleProps: /^_/,
		reserveProps: /^__gia_component__$/,
		mangleQuoted: false,
	},
	build: {
		emptyOutDir: false, // Don't wipe the main/minimal build files
		lib: {
			entry: resolve(__dirname, "lib/nano.js"),
			name: "gia",
			fileName: (format) => `gia.nano.${format === 'es' ? 'mjs' : 'umd.js'}`
		},
	},
});

