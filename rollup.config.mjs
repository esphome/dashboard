import { nodeResolve } from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import manifest from "./build-scripts/rollup/manifest-plugin.mjs";
import postcss from "rollup-plugin-postcss";
import postcssUrl from "postcss-url";
import commonjs from "@rollup/plugin-commonjs";
import monaco from "rollup-plugin-monaco-editor";
import copy from "rollup-plugin-copy";
import fs from "fs-extra";
import path from "path";

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
    sourcemap: true
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
              asset.pathname
            );
            fs.copySync(asset.absolutePath, targetFontPath);
            return "./static/fonts/" + asset.pathname;
          },
        }),
      ],
    }),
    copy({
      targets: [
        { src: "schema/*.json", dest: "esphome_dashboard/static/schema" },
      ],
    }),
    monaco({
      languages: ["yaml"],
      sourcemap: false,
    }),
    nodeResolve(),
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
