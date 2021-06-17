import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import manifest from "./build-scripts/rollup/manifest-plugin";

const isProdBuild = process.env.NODE_ENV === "production";

/**
 * @type { import("rollup").MergedRollupOptions }
 */
const config = {
  input: "src/index.ts",
  output: {
    dir: "esphome_dashboard/static/js/esphome/",
    format: "module",
    entryFileNames: isProdBuild ? "[name]-[hash].js" : "[name].js",
    chunkFileNames: isProdBuild ? "c.[hash].js" : "[name].js",
    assetFileNames: isProdBuild ? "a.[hash].js" : "[name].js",
  },
  preserveEntrySignatures: false,
  plugins: [
    typescript(),
    nodeResolve(),
    json(),
    manifest(),
    isProdBuild &&
      terser({
        ecma: 2019,
        toplevel: true,
        output: {
          comments: false,
        },
      }),
  ].filter(Boolean),
};

export default config;
