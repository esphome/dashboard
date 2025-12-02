const haRspack = require("./homeassistant-frontend/build-scripts/rspack.cjs");
const haPaths = require("./homeassistant-frontend/build-scripts/paths.cjs");
const path = require("path");
const fs = require("fs");

const isProdBuild = process.env.NODE_ENV === "production";

// Plugin to fix manifest.json format for ESPHome compatibility
// ESPHome expects {"index": "index.js"} but rspack produces {"index.js": "/static/js/esphome/index.js"}
class FixManifestPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync(
      "FixManifestPlugin",
      (compilation, callback) => {
        const manifestPath = path.resolve(
          compiler.options.output.path,
          "manifest.json",
        );
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
          const fixedManifest = {};
          for (const [key, value] of Object.entries(manifest)) {
            // Remove .js extension from key, extract just filename from value
            const newKey = key.replace(/\.js$/, "");
            const newValue = path.basename(value);
            fixedManifest[newKey] = newValue;
          }
          fs.writeFileSync(manifestPath, JSON.stringify(fixedManifest));
        } catch (e) {
          // Ignore errors
        }
        callback();
      },
    );
  }
}

// Override paths to point to our directory structure
haPaths.polymer_dir = __dirname;

const createConfig = ({ isProdBuild, latestBuild = true }) => {
  // Use the HA frontend's rspack configuration
  const config = haRspack.createRspackConfig({
    name: "esphome",
    entry: {
      index: path.resolve(__dirname, "src/index.ts"),
    },
    outputPath: path.resolve(__dirname, "esphome_dashboard/static/js/esphome"),
    publicPath: "/static/js/esphome/",
    isProdBuild,
    latestBuild,
    isStatsBuild: false,
    isTestBuild: false,
  });

  // Override output to use consistent filename
  config.output = {
    ...config.output,
    filename: "[name].js",
    chunkFilename: "[name].chunk.js",
  };

  // Override resolve to work with our setup
  config.resolve = {
    ...config.resolve,
    modules: [
      "node_modules",
      path.resolve(__dirname, "homeassistant-frontend/src"),
    ],
    alias: {
      ...config.resolve.alias,
      "@ha": path.resolve(__dirname, "homeassistant-frontend/src"),
      // Stub out HA frontend build artifacts that don't exist in this project
      "../../build/translations/translationMetadata.json": path.resolve(
        __dirname,
        "src/stubs/translationMetadata.json",
      ),
    },
  };

  // No dev server needed - we build directly to esphome_dashboard/static
  // The develop script uses --watch mode to rebuild on changes

  // Add plugin to fix manifest format for ESPHome
  config.plugins.push(new FixManifestPlugin());

  return config;
};

module.exports = isProdBuild
  ? createConfig({ isProdBuild: true })
  : createConfig({ isProdBuild: false });