import { LitElement, html, PropertyValues, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
import type { ESPLoader } from "esptool-js";
import { compileConfiguration, Configuration, getConfiguration } from "../api/configuration";
import { FileToFlash, flashFiles, getConfigurationFiles } from "../web-serial/flash";
import { openCompileDialog } from "../compile";
import { openInstallWebDialog } from ".";
import { chipFamilyToPlatform, SupportedPlatforms, type ChipFamily } from "../const";
import { esphomeDialogStyles } from "../styles";
import { sleep } from "../util/sleep";
import { resetSerialDevice } from "../web-serial/reset-serial-device";
import { buildWebSocketUrl } from "../util/websocket-url"; // NEW: For the queue websocket

const OK_ICON = "🎉";
const WARNING_ICON = "👀";

@customElement("esphome-install-web-dialog")
export class ESPHomeInstallWebDialog extends LitElement {
  @property() public params!: {
    port?: SerialPort;
    configuration?: string;
    filesCallback?: (platform: SupportedPlatforms) => Promise<FileToFlash[]>;
    erase?: boolean;
    isQueue?: boolean; // NEW: Flag for queued updates
    onClose?: (success: boolean) => void;
  };

  // Added 'queued' state
  @state() private _state: "pick" | "prepare" | "install" | "queued" | "done" = "prepare";
  @state() private _error?: string | TemplateResult;

  protected render() {
    if (this._state === "queued") {
      return this._renderQueued();
    }
    
    // Existing render logic for prepare/install/done
    return html`
      <mwc-dialog
        open
        heading="${this.params.isQueue ? 'Queuing Update' : 'Install'}"
        scrimClickAction
        @closed=${this._handleClose}
      >
        ${this._state === "prepare"
          ? html`
              <div class="center">
                <div>
                  Preparing installation...<br />
                  <br />
                </div>
                <mwc-circular-progress active></mwc-circular-progress>
              </div>
            `
          : this._state === "done"
          ? html`
              <div class="center">
                <div class="icon">${this._error ? WARNING_ICON : OK_ICON}</div>
                ${this._error ? html`<div class="error">${this._error}</div>` : ""}
              </div>
            `
          : html``}
        <mwc-button slot="primaryAction" dialogAction="close">
          ${this._state === "done" ? "Close" : "Cancel"}
        </mwc-button>
      </mwc-dialog>
    `;
  }

  private _renderQueued() {
    return html`
      <mwc-dialog open heading="Successfully Queued" @closed=${this._handleClose}>
        <div class="center">
          <div class="icon">${OK_ICON}</div>
          <p>
            The firmware for <b>${this.params.configuration}</b> was built successfully 
            and is now waiting in the update queue.
          </p>
          <p>The OTA update will start automatically the next time the device wakes up.</p>
        </div>
        <mwc-button slot="primaryAction" dialogAction="close">Close</mwc-button>
      </mwc-dialog>
    `;
  }

  protected async firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (this._state === "prepare") {
      await this._prepareConfig();
    }
  }

  private async _prepareConfig() {
    const configuration = this.params.configuration!;

    // NEW QUEUE LOGIC: Bypass web-serial entirely
    if (this.params.isQueue) {
      return new Promise<void>((resolve, reject) => {
        const socket = new WebSocket(buildWebSocketUrl("queue-update"));
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.event === "queued_success") {
            this._state = "queued";
            socket.close();
            resolve();
          }
        };

        socket.onerror = () => {
          this._error = html`Failed to connect to the queue service.`;
          this._state = "done";
          reject();
        };

        socket.onclose = () => {
          if (this._state !== "queued") {
            this._error = html`
              Compilation failed.<br /><br />
              <button class="link" @click=${this._openCompileDialog}>
                See what went wrong.
              </button>
            `;
            this._state = "done";
            reject();
          }
        };

        socket.onopen = () => {
          socket.send(JSON.stringify({ type: "spawn", configuration }));
        };
      });
    }

    // EXISTING WEB-SERIAL LOGIC
    try {
      if (this.params.filesCallback) {
        // ... (existing flash logic)
      } else {
        return await getConfigurationFiles(configuration);
      }
    } catch (err) {
      this._error = html`
        Failed to prepare configuration<br /><br />
        <button class="link" @click=${this._openCompileDialog}>
          See what went wrong.
        </button>
      `;
      this._state = "done";
    }
  }

  private _openCompileDialog() {
    openCompileDialog(this.params.configuration!);
    this._close();
  }

  private _close() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }

  private async _handleClose() {
    if (this.params.onClose) {
      this.params.onClose(this._state === "done" && this._error === undefined);
    }
    this.parentNode!.removeChild(this);
  }

  static styles = [
    esphomeDialogStyles,
    css`
      mwc-list-item {
        margin: 0 -20px;
      }
      svg {
        fill: currentColor;
      }
      .center {
        text-align: center;
      }
      mwc-circular-progress {
        margin-bottom: 16px;
      }
      .icon {
        font-size: 50px;
        line-height: 80px;
        color: black;
      }
    `,
  ];
}
