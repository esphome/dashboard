import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
// @ts-ignore
import editorStyles from "monaco-editor/min/vs/editor/editor.main.css";
import { fireEvent } from "../util/fire-event";
import { debounce } from "../util/debounce";
import { getFile } from "../api/files";
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
export class ESPHomeEditor extends LitElement {
  @property() public configuration!: string;

  private editor?: monaco.editor.IStandaloneCodeEditor;
  private editorActiveWebSocket: WebSocket | null = null;
  private editorValidationScheduled = false;
  private editorValidationRunning = false;
  private editorActiveSecrets = false;

  @query("main", true) private container!: HTMLElement;

  public getValue() {
    return this.editor!.getModel()?.getValue();
  }

  render() {
    return html`
      <style>
        ${editorStyles}
        ${ESPHomeEditor.styles}
      </style>
      <main></main>
    `;
  }

  firstUpdated() {
    // @ts-ignore
    self.MonacoEnvironment = {
      getWorkerUrl: function (moduleId: string, label: string) {
        return "./static/js/esphome/monaco-editor/esm/vs/editor/editor.worker.js";
      },
    };
    this.editor = monaco.editor.create(this.container, {
      value: this.configuration,
      language: "yaml",
      theme: "esphome",
      automaticLayout: true,
      // This is to have the popups above other stuff around the editor, otherwise they are hidden
      fixedOverflowWidgets: true,
      minimap: {
        enabled: false,
      },
      tabSize: 2,
      fontFamily:
        'ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
    });

    const filename = this.configuration;
    const editorActiveFilename = filename;
    const isSecrets = filename === "secrets.yaml" || filename === "secrets.yml";

    getFile(editorActiveFilename).then((response) => {
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
        file: editorActiveFilename,
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

  static styles = css`
    :host {
      --editor-width: 100%;
      --editor-height: 70vh;
    }
    main {
      width: var(--editor-width);
      height: var(--editor-height);
    }
  `;
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
