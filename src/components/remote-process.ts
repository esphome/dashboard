import { customElement } from "lit/decorators.js";
import { StreamError, streamLogs } from "../api";
import { ColoredConsole, coloredConsoleStyles } from "../util/console-color";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-remote-process")
class ESPHomeRemoteProcess extends HTMLElement {
  public type!:
    | "validate"
    | "logs"
    | "upload"
    | "clean-mqtt"
    | "clean"
    | "rename";
  public spawnParams!: Record<string, any>;

  private _coloredConsole?: ColoredConsole;
  private _abortController?: AbortController;

  public logs(): string {
    return this._coloredConsole?.logs() || "";
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

    const coloredConsole = new ColoredConsole(shadowRoot.querySelector("div")!);
    this._coloredConsole = coloredConsole;
    this._abortController = new AbortController();

    streamLogs(
      this.type,
      this.spawnParams,
      (line) => {
        coloredConsole.addLine(line);
      },
      this._abortController,
    ).then(
      () => {
        fireEvent(this, "process-done", 0);
      },
      (error: StreamError) => {
        fireEvent(this, "process-done", error.code);
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
