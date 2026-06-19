import { customElement } from "lit/decorators.js";
import { StreamError, streamLogs } from "../api";
import { ColoredConsole, coloredConsoleStyles } from "../util/console-color";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-remote-process")
class ESPHomeRemoteProcess extends HTMLElement {
  public type!: "validate" | "logs" | "upload" | "clean-mqtt" | "clean";
  public spawnParams!: Record<string, any>;

  private _coloredConsole?: ColoredConsole;
  private _abortController?: AbortController;

  public logs(): string {
    return this._coloredConsole?.logs() ?? "";
  }

  public connectedCallback() {
    if (this._coloredConsole) {
      return;
    }
    const shadowRoot = this.attachShadow({ mode: "open" });

    shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
        }
        ${coloredConsoleStyles}
      </style>
      <div class="log"></div>
    `;

    this._coloredConsole = new ColoredConsole(shadowRoot.querySelector("div")!);
    this._startStream();
  }

  public restart() {
    this._startStream();
  }

  private _startStream() {
    if (this._abortController) {
      this._abortController.abort();
    }
    const controller = new AbortController();
    this._abortController = controller;

    streamLogs(
      this.type,
      this.spawnParams,
      (line) => {
        this._coloredConsole?.addLine(line);
      },
      controller,
    ).then(
      () => {
        // Ignore the resolution of a stream we have already replaced.
        if (this._abortController === controller) {
          fireEvent(this, "process-done", 0);
        }
      },
      (error: StreamError) => {
        if (this._abortController === controller) {
          fireEvent(this, "process-done", error.code);
        }
      },
    );
  }

  public disconnectedCallback() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = undefined;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-remote-process": ESPHomeRemoteProcess;
  }
}
