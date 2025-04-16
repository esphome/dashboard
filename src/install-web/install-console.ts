import { ColoredConsole, coloredConsoleStyles } from "../util/console-color";
import { Logger } from "../const";

export class InstallConsole extends HTMLElement {
  public port!: SerialPort;
  public logger!: Logger;

  private _console?: ColoredConsole;

  public logs(): string {
    return this._console?.logs() || "";
  }

  public addLine(line: string) {
    this._console?.addLine(line);
  }

  public connectedCallback() {
    if (this._console) {
      return;
    }
    const shadowRoot = this.attachShadow({ mode: "open" });

    shadowRoot.innerHTML = `
      <style>
        :host, input {
          background-color: #1c1c1c;
          color: #ddd;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
            monospace;
          line-height: 1.45;
          display: flex;
          flex-direction: column;
        }
        form {
          display: flex;
          align-items: center;
          padding: 0 8px 0 16px;
        }
        input {
          flex: 1;
          padding: 4px;
          margin: 0 8px;
          border: 0;
          outline: none;
        }
        ${coloredConsoleStyles}
      </style>
      <div class="log"></div>
    `;

    this._console = new ColoredConsole(this.shadowRoot!.querySelector("div")!);
  }
}

customElements.define("install-console", InstallConsole);

declare global {
  interface HTMLElementTagNameMap {
    "install-console": InstallConsole;
  }
}
