import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { terserPlugin, sharedEsbuildOptions, sharedRollupOptions, UMD_RANK, UMD_STAGING_GLOBAL } from "./vite.shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	define: {
		__GIA_MINI__: "true",
		__GIA_NANO__: "true",
	},
	esbuild: sharedEsbuildOptions,
	plugins: [terserPlugin({ umdRank: UMD_RANK.nano })],
	build: {
		emptyOutDir: false, // Don't wipe the main/minimal build files
		lib: {
			entry: resolve(__dirname, "lib/nano.js"),
			name: UMD_STAGING_GLOBAL,
			fileName: (format) => `gia.nano.${format === "es" ? "mjs" : "umd.js"}`,
		},
		rollupOptions: sharedRollupOptions,
	},
});

