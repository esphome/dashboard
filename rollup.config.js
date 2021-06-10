import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

const config = {
  input: "dist/index.js",
  output: {
    dir: "esphome_frontend/static/js/esphome/",
    format: "module",
  },
  preserveEntrySignatures: false,
  plugins: [nodeResolve(), json()],
};

if (process.env.NODE_ENV === "production") {
  config.plugins.push(
    terser({
      ecma: 2019,
      toplevel: true,
      output: {
        comments: false,
      },
    })
  );
}

export default config;
