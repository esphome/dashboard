import { compileConfigurationMetadata } from "../api/configuration";

export class MetadataRefresher {
  toRefresh: string[] = [];
  compileFailed = new Set<string>();
  running = false;

  add(configuration: string) {
    if (this.compileFailed.has(configuration)) {
      return;
    }

    this.toRefresh.push(configuration);

    if (!this.running) {
      this.running = true;
      this.run();
    }
  }

  async run() {
    while (this.toRefresh.length) {
      const configuration = this.toRefresh.shift()!;
      try {
        await compileConfigurationMetadata(configuration);
      } catch (err) {
        this.compileFailed.add(configuration);
      }
    }

    this.running = false;
  }
}
