import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { createRef, Ref, ref } from "lit/directives/ref.js";
// @ts-ignore
import styles from "monaco-editor/min/vs/editor/editor.main.css";

// WebSocket URL Helper
const loc = window.location;
const wsLoc = new URL("./", `${loc.protocol}//${loc.host}${loc.pathname}`);
wsLoc.protocol = "ws:";
if (loc.protocol === "https:") {
  wsLoc.protocol = "wss:";
}
const wsUrl = wsLoc.href;

let editorActiveFilename: string | null = null;
let editorActiveSecrets = false;
let editorActiveWebSocket: WebSocket | null = null;
let editorValidationScheduled = false;
let editorValidationRunning = false;

@customElement("esphome-editor")
export class ESPHomeEditor extends LitElement {
  private container: Ref<HTMLElement> = createRef();
  editor?: monaco.editor.IStandaloneCodeEditor;
  @property() theme?: string;
  @property() language?: string;

  @property() public configuration!: string;

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

  public getValue() {
    return this.editor!.getModel()?.getValue();
  }

  render() {
    return html`
      <style>
        ${styles}
        ${ESPHomeEditor.styles}
      </style>
      <div>start</div>
      <div id="js-loading-indicator">
        <div class="preloader-wrapper big active">
          <div class="spinner-layer spinner-blue-only">
            <div class="circle-clipper left">
              <div class="circle"></div>
            </div>
            <div class="gap-patch">
              <div class="circle"></div>
            </div>
            <div class="circle-clipper right">
              <div class="circle"></div>
            </div>
          </div>
        </div>
      </div>
      <div>end</div>
      <main ${ref(this.container)}></main>
    `;
  }

  firstUpdated() {
    // @ts-ignore
    self.MonacoEnvironment = {
      getWorkerUrl: function (moduleId: string, label: string) {
        // if (label === 'json') {
        //   return './json.worker.bundle.js';
        // }
        // if (label === 'css' || label === 'scss' || label === 'less') {
        //   return './css.worker.bundle.js';
        // }
        // if (label === 'html' || label === 'handlebars' || label === 'razor') {
        //   return './html.worker.bundle.js';
        // }
        // if (label === 'typescript' || label === 'javascript') {
        //   return './ts.worker.bundle.js';

        return "./static/js/esphome/monaco-editor/esm/vs/editor/editor.worker.js";
      },
    };
    this.editor = monaco.editor.create(this.container.value!, {
      value: this.configuration,
      language: "yaml",
      theme: "dark",
      automaticLayout: true,
    });
    // window
    //   .matchMedia("(prefers-color-scheme: dark)")
    //   .addEventListener("change", () => {
    //     monaco.editor.setTheme(this.getTheme());
    //   });
    const filename = this.configuration;
    editorActiveFilename = filename;
    const isSecrets = filename === "secrets.yaml" || filename === "secrets.yml";
    const filenameField = document.querySelector(
      "#js-editor-modal #js-node-filename"
    );
    // filenameField.innerHTML = editorActiveFilename;

    // saveButton.setAttribute("data-filename", editorActiveFilename);
    // uploadButton.setAttribute("data-filename", editorActiveFilename);
    // uploadButton.onclick = () => saveFile(editorActiveFilename);
    if (isSecrets) {
      //   uploadButton.style.display = "none";
      // editorActiveSecrets = true;
    } else {
      // uploadButton.style.display = "";
      // editorActiveSecrets = false;
    }
    // closeButton.setAttribute("data-filename", editorActiveFilename);

    const loadingIndicator = document.querySelector(
      "#js-editor-modal #js-loading-indicator"
    );
    const editorArea = document.querySelector(
      "#js-editor-modal #js-editor-area"
    );

    // loadingIndicator.style.display = "block";
    // editorArea.style.display = "none";

    // editor.setOption("readOnly", true);
    fetch(`./edit?configuration=${editorActiveFilename}`, {
      credentials: "same-origin",
    })
      .then((res) => res.text())
      .then((response) => {
        if (response === "" && isSecrets) {
          response = EMPTY_SECRETS;
        }
        this.editor?.setValue(response);

        //editor.setOption("readOnly", false);
        //loadingIndicator.style.display = "none";
        //editorArea.style.display = "block";

        this.startAceWebsocket();
      });

    this.editor.focus();

    this.editor.getModel()?.onDidChangeContent(
      debounce(() => {
        editorValidationScheduled = !editorActiveSecrets;
        console.log("editor model changed", editorValidationScheduled);
      }, 250)
    );
  }

  // Editor WebSocket Validation
  startAceWebsocket() {
    editorActiveWebSocket = new WebSocket(`${wsUrl}ace`);

    editorActiveWebSocket.addEventListener("message", (event) => {
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
          console.log("Setting markers", markers);

          editorValidationRunning = false;
        } else if (msg.type === "read_file") {
          sendAceStdin({
            type: "file_response",
            content: this.editor?.getValue(),
          });
        }
      }
    });

    editorActiveWebSocket.addEventListener("open", () => {
      const msg = JSON.stringify({ type: "spawn" });
      editorActiveWebSocket!.send(msg);
    });

    editorActiveWebSocket.addEventListener("close", () => {
      editorActiveWebSocket = null;
      setTimeout(this.startAceWebsocket, 5000);
    });
  }
}

const debounce = (func: Function, wait: number) => {
  let timeout: number | null;
  return function () {
    // @ts-ignore
    let context = this,
      args = arguments;
    let later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout!);
    // @ts-ignore
    timeout = setTimeout(later, wait);
  };
};

const sendAceStdin = (data: any) => {
  let send = JSON.stringify({
    type: "stdin",
    data: JSON.stringify(data) + "\n",
  });
  editorActiveWebSocket!.send(send);
};

setInterval(() => {
  if (!editorValidationScheduled || editorValidationRunning) return;
  if (editorActiveWebSocket == null) return;

  sendAceStdin({
    type: "validate",
    file: editorActiveFilename,
  });
  editorValidationRunning = true;
  editorValidationScheduled = false;
}, 100);

const EMPTY_SECRETS = `# Your Wi-Fi SSID and password
wifi_ssid: "REPLACEME"
wifi_password: "REPLACEME"
`;

declare global {
  interface HTMLElementTagNameMap {
    "esphome-editor": ESPHomeEditor;
  }
}
