import { customElement } from "lit/decorators.js";
import { StreamError, streamLogs } from "../api";
import { ColoredConsole } from "../util/console-color";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-remote-process")
class ESPHomeRemoteProcess extends HTMLElement {
  public type!: "validate" | "logs" | "upload";
  public filename!: string;

  private _abortController?: AbortController;
  private _setup = false;

  public connectedCallback() {
    if (this._setup) {
      return;
    }
    this._setup = true;
    const shadowRoot = this.attachShadow({ mode: "open" });

    shadowRoot.innerHTML = `
      <style>
        .log {
          height: 100%;
          max-height: calc(100% - 56px);
          background-color: #1c1c1c;
          margin-top: 0;
          margin-bottom: 0;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
          font-size: 12px;
          padding: 16px;
          overflow: auto;
          line-height: 1.45;
          border-radius: 3px;
          white-space: pre-wrap;
          overflow-wrap: break-word;
          color: #ddd;
        }

        .log-bold {
          font-weight: bold;
        }
        .log-italic {
          font-style: italic;
        }
        .log-underline {
          text-decoration: underline;
        }
        .log-strikethrough {
          text-decoration: line-through;
        }
        .log-underline.log-strikethrough {
          text-decoration: underline line-through;
        }
        .log-secret {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        .log-secret-redacted {
          opacity: 0;
          width: 1px;
          font-size: 1px;
        }
        .log-fg-black {
          color: rgb(128, 128, 128);
        }
        .log-fg-red {
          color: rgb(255, 0, 0);
        }
        .log-fg-green {
          color: rgb(0, 255, 0);
        }
        .log-fg-yellow {
          color: rgb(255, 255, 0);
        }
        .log-fg-blue {
          color: rgb(0, 0, 255);
        }
        .log-fg-magenta {
          color: rgb(255, 0, 255);
        }
        .log-fg-cyan {
          color: rgb(0, 255, 255);
        }
        .log-fg-white {
          color: rgb(187, 187, 187);
        }
        .log-bg-black {
          background-color: rgb(0, 0, 0);
        }
        .log-bg-red {
          background-color: rgb(255, 0, 0);
        }
        .log-bg-green {
          background-color: rgb(0, 255, 0);
        }
        .log-bg-yellow {
          background-color: rgb(255, 255, 0);
        }
        .log-bg-blue {
          background-color: rgb(0, 0, 255);
        }
        .log-bg-magenta {
          background-color: rgb(255, 0, 255);
        }
        .log-bg-cyan {
          background-color: rgb(0, 255, 255);
        }
        .log-bg-white {
          background-color: rgb(255, 255, 255);
        }
      </style>
      <div class="log"></div>
    `;

    const coloredConsole = new ColoredConsole(shadowRoot.querySelector("div")!);
    this._abortController = new AbortController();

    streamLogs(
      this.type,
      this.filename,
      (line) => {
        coloredConsole.addLine(line);
      },
      this._abortController
    ).then(
      () => {
        fireEvent(this, "process-done", 0);
      },
      (error: StreamError) => {
        fireEvent(this, "process-done", error.code);
      }
    );
  }

  public disconnectedCallback() {
    if (this._abortController) {
      this._abortController.abort();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-remote-process": ESPHomeRemoteProcess;
  }
}
