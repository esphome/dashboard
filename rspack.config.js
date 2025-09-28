const haRspack = require("./homeassistant-frontend/build-scripts/rspack.cjs");
const haPaths = require("./homeassistant-frontend/build-scripts/paths.cjs");
const path = require("path");

const isProdBuild = process.env.NODE_ENV === "production";

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
    },
  };

  // No dev server needed - we build directly to esphome_dashboard/static
  // The develop script uses --watch mode to rebuild on changes

  return config;
};

module.exports = isProdBuild
  ? createConfig({ isProdBuild: true })
  : createConfig({ isProdBuild: false });