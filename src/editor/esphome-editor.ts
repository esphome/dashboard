import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { LitElement, html } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "@material/mwc-snackbar";
import "@material/mwc-icon-button";
import "@material/mwc-list/mwc-list-item.js";
import { openInstallChooseDialog } from "../install-choose";
import { getFileWithMtime, writeFileWithMtime } from "../api/files";
import { APIError } from "../api";
import type { Snackbar } from "@material/mwc-snackbar";
import type { Dialog } from "@material/mwc-dialog";
import { fireEvent } from "../util/fire-event";
import { debounce } from "../util/debounce";
import "./monaco-provider";
import { setSchemaVersion } from "./editor-shims";

// WebSocket URL Helper
const loc = window.location;
const wsLoc = new URL("./", `${loc.protocol}//${loc.host}${loc.pathname}`);
wsLoc.protocol = "ws:";
if (loc.protocol === "https:") {
  wsLoc.protocol = "wss:";
}
const wsUrl = wsLoc.href;
const darkQuery: MediaQueryList = window.matchMedia(
  "(prefers-color-scheme: dark)",
);

@customElement("esphome-editor")
class ESPHomeEditor extends LitElement {
  private editor?: monaco.editor.IStandaloneCodeEditor;
  private editorActiveWebSocket: WebSocket | null = null;
  private editorValidationScheduled = false;
  private editorValidationRunning = false;
  private editorActiveSecrets = false;
  private fileMtime: string | null = null;

  @property() public fileName!: string;
  @query("mwc-snackbar", true) private _snackbar!: Snackbar;
  @query("mwc-dialog#conflict-dialog") private conflictDialog?: Dialog;
  @query("main", true) private container!: HTMLElement;
  @query(".esphome-header", true) private editor_header!: HTMLElement;

  createRenderRoot() {
    return this;
  }

  protected render() {
    const isSecrets =
      this.fileName === "secrets.yaml" || this.fileName === "secrets.yml";

    return html`
      <style>
        html,
        body {
          height: 100vh;
          overflow: hidden;
        }
        .esphome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          align-content: stretch;
        }
        h2 {
          line-height: 100%;
          /* this margin, padding stretches the container, offsetHeight does not calculate margin of .editor-header */
          padding: 0.8rem 0.5rem 1rem 0.5rem;
          margin: 0px;
          font-size: 1.4rem;
          flex: 1 1 auto;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        mwc-icon-button {
          --mdc-icon-button-size: 32px;
        }
        mwc-button {
          --mdc-theme-primary: var(--primary-text-color);
        }
        #conflict-dialog mwc-button[slot="secondaryAction"] {
          --mdc-theme-primary: var(--alert-error-color);
        }
        #conflict-dialog ul {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        #conflict-dialog p {
          margin: 0.5rem 0;
        }
      </style>
      <mwc-snackbar leading></mwc-snackbar>

      <!-- Conflict dialog -->
      <mwc-dialog id="conflict-dialog" heading="Conflict Detected">
        <div>
          <p>This file was modified from another tab or external editor.</p>
          <p><strong>Your options:</strong></p>
          <ul>
            <li>
              <strong>Cancel</strong> - Don't save, editor remains open for
              reference
            </li>
            <li>
              <strong>Overwrite</strong> - Save anyway, overwriting changes on
              the server
            </li>
          </ul>
        </div>
        <mwc-button
          slot="primaryAction"
          @click=${() => this.conflictDialog?.close()}
        >
          Cancel
        </mwc-button>
        <mwc-button slot="secondaryAction" @click=${this._handleOverwrite}>
          Overwrite
        </mwc-button>
      </mwc-dialog>

      <div class="esphome-header">
        <mwc-icon-button
          icon="clear"
          @click=${this._handleClose}
          aria-label="close"
        ></mwc-icon-button>
        <h2>${this.fileName}</h2>

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
      </div>
      <main></main>
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
    openInstallChooseDialog(this.fileName);
  }

  private async _saveFile(forceOrEvent?: boolean | Event) {
    // Check if the first argument is an event object or our force parameter
    const force = typeof forceOrEvent === "boolean" ? forceOrEvent : false;

    const code = this.getValue();
    if (this._snackbar.open) {
      this._snackbar.close();
    }

    try {
      // Send mtime unless force is true
      const mtime = force ? undefined : (this.fileMtime ?? undefined);
      const result = await writeFileWithMtime(this.fileName, code ?? "", mtime);

      // Update stored mtime with new value from server
      this.fileMtime = result.newMtime;

      this._showSnackbar(`✅ Saved ${this.fileName}`);
    } catch (error) {
      if (error instanceof APIError && error.status === 409) {
        // Conflict detected - show dialog
        this.conflictDialog?.show();
      } else if (error instanceof APIError && error.status === 404) {
        // File was deleted
        this._showSnackbar(`❌ File ${this.fileName} was deleted`);
      } else {
        // Generic error
        console.error("Error saving file:", error);
        this._showSnackbar(`❌ An error occurred saving ${this.fileName}`);
      }
    }
  }

  private async _handleOverwrite() {
    // Force save, bypassing conflict check
    this.conflictDialog?.close();
    await this._saveFile(true);
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
    darkQuery.addEventListener("change", () => {
      monaco.editor.setTheme(darkQuery.matches ? "esphome-dark" : "esphome");
    });
    this.editor = monaco.editor.create(this.container, {
      value: "",
      language: "esphome",
      theme: darkQuery.matches ? "esphome-dark" : "esphome",
      minimap: {
        enabled: false,
      },
      tabSize: 2,
      dimension: this.calcEditorSize(),
      fontFamily:
        'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
    });

    const isSecrets =
      this.fileName === "secrets.yaml" || this.fileName === "secrets.yml";

    getFileWithMtime(this.fileName).then((response) => {
      if (response.content === null && isSecrets) {
        this.editor?.setValue(EMPTY_SECRETS);
        this.fileMtime = null;
      } else {
        this.editor?.setValue(response.content ?? "");
        this.fileMtime = response.mtime;
      }

      this.startAceWebsocket();
    });

    this.editor.focus();

    this.editor.getModel()?.onDidChangeContent(
      debounce(() => {
        this.editorValidationScheduled = !this.editorActiveSecrets;
      }, 250),
    );

    this.editor.addAction({
      id: "action-save-file",
      label: "Save file",
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        this._saveFile();
      },
    });

    if (isSecrets) {
      return;
    }

    setInterval(() => {
      if (!this.editorValidationScheduled || this.editorValidationRunning)
        return;
      if (this.editorActiveWebSocket == null) return;
      if (this.editorActiveWebSocket.readyState != 1) return;

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
      data: `${JSON.stringify(data)}\n`,
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
        if (msg.type === "version") {
          setSchemaVersion(msg.value);
        } else if (msg.type === "result") {
          const markers: monaco.editor.IMarkerData[] = [];

          for (const v of msg.validation_errors.reverse()) {
            const marker: monaco.editor.IMarkerData = {
              message: v.message,
              severity: monaco.MarkerSeverity.Error,
              startLineNumber: 1,
              startColumn: 1,
              endLineNumber: 1,
              endColumn: 1,
            };
            if (v.range) {
              marker.startLineNumber = v.range.start_line + 1;
              marker.startColumn = v.range.start_col + 1;
              marker.endLineNumber = v.range.end_line + 1;
              marker.endColumn = v.range.end_col + 11;
            }
            markers.push(marker);
          }
          for (const v of msg.yaml_errors) {
            let yamlError = (v.message as string).match(
              /Invalid YAML syntax:[\r\n][\r\n](.*)[\r\n]\s\sin "([^"]*)", line (\d*), column (\d*):/,
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

  calcEditorSize() {
    return {
      width: document.body.offsetWidth,
      height: window.innerHeight - this.editor_header.offsetHeight,
    };
  }
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener("resize", this._handleResize);
  }
  disconnectedCallback() {
    window.removeEventListener("resize", this._handleResize);
    super.disconnectedCallback();
  }
  _handleResize = () => {
    this.editor?.layout(this.calcEditorSize());
  };
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
