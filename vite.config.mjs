import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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









