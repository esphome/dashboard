import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { writeFileSync, readFileSync } from "fs";

import nunjucks from "nunjucks";
const IS_PROD = process.env.NODE_ENV === "production";
const WEB_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const INPUT = resolve(WEB_DIR, "src/index.template.html");
const OUTPUT = resolve(WEB_DIR, "dist/index.html");

const VARS = {
  streamer_mode: false,
  login_enabled: false,
  docs_link: "https://esphome.io/",
  get_static_file_url: (path) => {
    if (IS_PROD && path === "js/esphome/index.js") {
      path = path.replace(
        "index.js",
        JSON.parse(
          readFileSync(resolve(WEB_DIR, "dist/static/js/esphome/manifest.json"))
        )["index"]
      );
    }

    return `/static/${path}`;
  },
  version: "",
};

class CustomLoader extends nunjucks.FileSystemLoader {
  constructor() {
    super(resolve(WEB_DIR, ".."));
  }

  getSource(name) {
    const source = super.getSource(name);
    // Templates are in tornado-template which uses a generic 'end' while
    // nunjucks as unique 'end' tags for each operator.
    // We only use blocks so just replace end with endblock.
    source.src = source.src.replace(/{% end %}/g, "{% endblock %}");
    return source;
  }
}

const env = new nunjucks.Environment(new CustomLoader());
const content = env.render("web.esphome.io/src/index.template.html", VARS);

writeFileSync(OUTPUT, content);
