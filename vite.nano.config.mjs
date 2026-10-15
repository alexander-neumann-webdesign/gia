import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { terserPlugin, sharedEsbuildOptions, sharedRollupOptions } from "./vite.shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	define: {
		__GIA_MINI__: "true",
		__GIA_NANO__: "true",
	},
	esbuild: sharedEsbuildOptions,
	plugins: [terserPlugin()],
	build: {
		emptyOutDir: false, // Don't wipe the main/minimal build files
		lib: {
			entry: resolve(__dirname, "lib/nano.js"),
			name: "gia",
			fileName: (format) => `gia.nano.${format === "es" ? "mjs" : "umd.js"}`,
		},
		rollupOptions: sharedRollupOptions,
	},
});

