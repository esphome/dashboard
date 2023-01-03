export default function (userOptions = {}) {
  return {
    name: "manifest",
    generateBundle(outputOptions, bundle) {
      const manifest = {};

      for (const chunk of Object.values(bundle)) {
        if (!chunk.isEntry) {
          continue;
        }
        manifest[chunk.name] = chunk.fileName;
      }

      this.emitFile({
        type: "asset",
        source: JSON.stringify(manifest, undefined, 2),
        name: "manifest.json",
        fileName: "manifest.json",
      });
    },
  };
}
