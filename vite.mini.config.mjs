import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { terserPlugin, sharedEsbuildOptions, sharedRollupOptions, UMD_RANK, UMD_STAGING_GLOBAL } from "./vite.shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	define: {
		__GIA_MINI__: "true",
		__GIA_NANO__: "false",
	},
	esbuild: sharedEsbuildOptions,
	plugins: [terserPlugin({ umdRank: UMD_RANK.mini })],
	build: {
		emptyOutDir: false, // Don't wipe the main build files
		lib: {
			entry: resolve(__dirname, "lib/mini.js"),
			name: UMD_STAGING_GLOBAL,
			fileName: (format) => `gia.mini.${format === "es" ? "mjs" : "umd.js"}`,
		},
		rollupOptions: sharedRollupOptions,
	},
});

