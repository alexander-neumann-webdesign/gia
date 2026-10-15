import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { terserPlugin, sharedEsbuildOptions, sharedRollupOptions } from "./vite.shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	define: {
		__GIA_MINI__: "true",
	},
	esbuild: sharedEsbuildOptions,
	plugins: [terserPlugin()],
	build: {
		emptyOutDir: false, // Don't wipe the main build files
		lib: {
			entry: resolve(__dirname, "lib/mini.js"),
			name: "gia",
			fileName: (format) => `gia.mini.${format === "es" ? "mjs" : "umd.js"}`,
		},
		rollupOptions: sharedRollupOptions,
	},
});

