import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "@material/mwc-snackbar";
import "@material/mwc-list/mwc-list-item.js";
import { openInstallChooseDialog } from "../install-choose";
import { getFile, writeFile } from "../api/files";
import type { Snackbar } from "@material/mwc-snackbar";
import { fireEvent } from "../util/fire-event";
// @ts-ignore
import editorStyles from "monaco-editor/min/vs/editor/editor.main.css";
import { debounce } from "../util/debounce";
import "./monaco-provider";

// WebSocket URL Helper
const loc = window.location;
const wsLoc = new URL("./", `${loc.protocol}//${loc.host}${loc.pathname}`);
wsLoc.protocol = "ws:";
if (loc.protocol === "https:") {
  wsLoc.protocol = "wss:";
}
const wsUrl = wsLoc.href;

@customElement("esphome-editor")
class ESPHomeEditor extends LitElement {
  private editor?: monaco.editor.IStandaloneCodeEditor;
  private editorActiveWebSocket: WebSocket | null = null;
  private editorValidationScheduled = false;
  private editorValidationRunning = false;
  private editorActiveSecrets = false;

  @property() public fileName!: string;
  @query("mwc-snackbar", true) private _snackbar!: Snackbar;
  @query("editor-container", true) private container!: HTMLElement;

  createRenderRoot() {
    return this;
  }

  protected render() {
    const isSecrets =
      this.fileName === "secrets.yaml" || this.fileName === "secrets.yml";

    return html`
      <style>
        editor-container {
          flex: 1 0;
        }
        h2 {
          line-height: 100%;
          margin: 0.5rem;
          font-size: 1.4rem;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          align-content: stretch;
        }
      </style>
      <mwc-snackbar leading></mwc-snackbar>

      <div class="editor-header">
        <h2>Edit ${this.fileName}</h2>
        <div>
          <mwc-button
            slot="secondaryAction"
            label="Save"
            @click=${this._saveFile}
          ></mwc-button>
          ${isSecrets
            ? ""
            : html` <mwc-button
                slot="secondaryAction"
                label="Install"
                @click=${this.handleInstall}
              ></mwc-button>`}
          <mwc-button
            slot="secondaryAction"
            label="Close"
            @click=${this._handleClose}
          ></mwc-button>
        </div>
      </div>
      <editor-container>
        <style>
          ${editorStyles}
        </style>
      </editor-container>
    `;
  }

  public getValue() {
    return this.editor!.getModel()?.getValue();
  }

  private _handleClose() {
    fireEvent(this, "close");
  }

  private async handleInstall() {
    await this._saveFile();
    this._handleClose();
    openInstallChooseDialog(this.fileName);
  }

  private async _saveFile() {
    const code = this.getValue();
    if (this._snackbar.open) {
      this._snackbar.close();
    }

    try {
      await writeFile(this.fileName, code ?? "");
      this._showSnackbar(`✅ Saved ${this.fileName}`);
    } catch (error) {
      this._showSnackbar(`❌ An error occured saving ${this.fileName}`);
    }
  }

  private _showSnackbar(message: string) {
    this._snackbar.labelText = message;
    this._snackbar.show();
  }

  firstUpdated() {
    // @ts-ignore
    self.MonacoEnvironment = {
      getWorkerUrl: function (moduleId: string, label: string) {
        return "./static/js/esphome/monaco-editor/esm/vs/editor/editor.worker.js";
      },
    };
    this.editor = monaco.editor.create(this.container, {
      value: "",
      language: "yaml",
      theme: "esphome",
      minimap: {
        enabled: false,
      },
      tabSize: 2,
      fontFamily:
        "SFMono-Regular, Consolas, Liberation Mono, Menlo, Courier, monospace",
    });

    const isSecrets =
      this.fileName === "secrets.yaml" || this.fileName === "secrets.yml";

    getFile(this.fileName).then((response) => {
      if (response === null && isSecrets) {
        response = EMPTY_SECRETS;
      }
      this.editor?.setValue(response ?? "");

      this.startAceWebsocket();
    });

    this.editor.focus();

    this.editor.getModel()?.onDidChangeContent(
      debounce(() => {
        this.editorValidationScheduled = !this.editorActiveSecrets;
      }, 250)
    );

    this.editor.addAction({
      id: "action-save-file",
      label: "Save file",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        fireEvent(this, "save");
      },
    });

    if (isSecrets) {
      return;
    }

    setInterval(() => {
      if (!this.editorValidationScheduled || this.editorValidationRunning)
        return;
      if (this.editorActiveWebSocket == null) return;

      this.sendAceStdin({
        type: "validate",
        file: this.fileName,
      });
      this.editorValidationRunning = true;
      this.editorValidationScheduled = false;
    }, 100);
  }

  sendAceStdin(data: any) {
    let send = JSON.stringify({
      type: "stdin",
      data: JSON.stringify(data) + "\n",
    });
    this.editorActiveWebSocket!.send(send);
  }

  // Editor WebSocket Validation
  startAceWebsocket() {
    this.editorActiveWebSocket = new WebSocket(`${wsUrl}ace`);

    this.editorActiveWebSocket.addEventListener("message", (event) => {
      const raw = JSON.parse(event.data);
      if (raw.event === "line") {
        const msg = JSON.parse(raw.data);
        if (msg.type === "result") {
          const markers: monaco.editor.IMarkerData[] = [];

          for (const v of msg.validation_errors.reverse()) {
            markers.push({
              message: v.message,
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: v.range?.start_line + 1 ?? 1,
              startColumn: v.range?.start_col + 1 ?? 1,
              endLineNumber: v.range?.end_line + 1 ?? 1,
              endColumn: v.range?.end_col + 11 ?? 1,
            });
          }
          for (const v of msg.yaml_errors) {
            let yamlError = (v.message as string).match(
              /Invalid YAML syntax:[\r\n][\r\n](.*)[\r\n]\s\sin "([^"]*)", line (\d*), column (\d*):/
            );
            console.log("YAML", v, yamlError);
            if (yamlError) {
              markers.push({
                message: yamlError[1],
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: parseInt(yamlError[3]),
                startColumn: parseInt(yamlError[4]),
                endLineNumber: 0,
                endColumn: 0,
              });
            } else
              markers.push({
                message: v.message,
                severity: monaco.MarkerSeverity.Error,
                startLineNumber: v.range?.start_line ?? 0,
                startColumn: v.range?.start_col ?? 1,
                endLineNumber: v.range?.end_line ?? 0,
                endColumn: v.range?.end_col ?? 1,
              });
          }

          const model = this.editor!.getModel();
          monaco.editor.setModelMarkers(model!, "esphome", markers);

          this.editorValidationRunning = false;
        } else if (msg.type === "read_file") {
          this.sendAceStdin({
            type: "file_response",
            content: this.editor?.getValue(),
          });
        }
      }
    });

    this.editorActiveWebSocket.addEventListener("open", () => {
      const msg = JSON.stringify({ type: "spawn" });
      this.editorActiveWebSocket!.send(msg);
    });

    this.editorActiveWebSocket.addEventListener("close", () => {
      this.editorActiveWebSocket = null;
      setTimeout(this.startAceWebsocket, 5000);
    });
  }
}

const EMPTY_SECRETS = `# Your Wi-Fi SSID and password
wifi_ssid: "REPLACEME"
wifi_password: "REPLACEME"
`;

declare global {
  interface HTMLElementTagNameMap {
    "esphome-editor": ESPHomeEditor;
  }
}
