import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	define: {
		__GIA_MINI__: "true"
	},
	esbuild: {
		mangleProps: /^_/,
		reserveProps: /^__gia_component__$/,
		mangleQuoted: false,
		legalComments: 'none',
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

