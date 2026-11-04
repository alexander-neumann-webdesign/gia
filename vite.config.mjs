import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import { terserPlugin, sharedEsbuildOptions, sharedRollupOptions, UMD_RANK, UMD_STAGING_GLOBAL } from "./vite.shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	define: {
		__GIA_MINI__: "false",
	},
	esbuild: sharedEsbuildOptions,
	plugins: [terserPlugin({ umdRank: UMD_RANK.full })],
	build: {
		lib: {
			entry: resolve(__dirname, "lib/main.js"),
			name: UMD_STAGING_GLOBAL,
			fileName: (format) => `gia.full.${format === "es" ? "mjs" : "umd.js"}`,
		},
		rollupOptions: sharedRollupOptions,
	},
});

