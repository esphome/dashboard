import { nodeResolve } from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

const config = {
  input: "src/index.ts",
  output: {
    dir: "esphome_frontend/static/js/esphome/",
    format: "module",
  },
  preserveEntrySignatures: false,
  plugins: [typescript(), nodeResolve(), json()],
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
