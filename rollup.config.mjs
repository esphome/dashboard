import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import fs from "fs-extra";
import path from "path";
import postcssUrl from "postcss-url";
import copy from "rollup-plugin-copy";
import postcss from "rollup-plugin-postcss";
import manifest from "./build-scripts/rollup/manifest-plugin.mjs";

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
    sourcemap: true,
  },
  preserveEntrySignatures: false,
  plugins: [
    typescript(),
    postcss({
      plugins: [
        postcssUrl({
          url: (asset) => {
            if (!/\.ttf$/.test(asset.url)) return asset.url;
            const distPath = path.join(process.cwd(), "esphome");
            const distFontsPath = path.join(distPath, "fonts");
            fs.ensureDirSync(distFontsPath);
            const targetFontPath = path.join(
              "esphome_dashboard/static/fonts/",
              asset.pathname,
            );
            fs.copySync(asset.absolutePath, targetFontPath);
            return `./static/fonts/${asset.pathname}`;
          },
        }),
      ],
    }),
    copy({
      targets: [
        { src: "schema/*.json", dest: "esphome_dashboard/static/schema" },
        {
          src: "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
          dest: "esphome_dashboard/static/js/esphome/monaco-editor/esm/vs/editor/",
        },
        {
          src: "node_modules/monaco-editor/esm/vs/base/worker/workerMain.js",
          dest: "esphome_dashboard/static/js/esphome/monaco-editor/esm/vs/base/worker/",
        },
      ],
    }),
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    json(),
    manifest(),
    isProdBuild &&
      terser({
        ecma: 2019,
        toplevel: true,
        format: {
          comments: false,
        },
      }),
  ].filter(Boolean),
};

export default config;
