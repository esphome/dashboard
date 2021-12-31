import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import config from "../rollup.config.js";

const WEB_DIR = dirname(fileURLToPath(import.meta.url));

config.input = resolve(WEB_DIR, "src/index.ts");
config.output.dir = resolve(WEB_DIR, "dist/static/js/esphome/");

export default config;
