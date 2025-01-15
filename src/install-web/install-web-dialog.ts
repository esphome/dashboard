import { LitElement, html, PropertyValues, css, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
import type { ESPLoader } from "esptool-js";
import "./install-console";
import type { InstallConsole } from "./install-console";
import {
  compileConfiguration,
  Configuration,
  getConfiguration,
} from "../api/configuration";
import {
  FileToFlash,
  flashFiles,
  getConfigurationFiles,
} from "../web-serial/flash";
import { openCompileDialog } from "../compile";
import { openInstallWebDialog } from ".";
import { chipFamilyToPlatform } from "../const";
import { esphomeDialogStyles } from "../styles";
import { sleep } from "../util/sleep";

const OK_ICON = "🎉";
const WARNING_ICON = "👀";

type ValueOf<T> = T[keyof T];

@customElement("esphome-install-web-dialog")
export class ESPHomeInstallWebDialog extends LitElement {
  @property() public params!: {
    // If a port was passed in, the port will not be closed when dialog closes
    port?: SerialPort;
    // Pass either a configuration or a filesCallback. filesCallback receives platform of ESP device.
    configuration?: string;
    filesCallback?: (
      platform: ValueOf<typeof chipFamilyToPlatform>,
    ) => Promise<FileToFlash[]>;
    // Should the device be erased before installation
    erase?: boolean;
    // Callback when the dialog is closed. Note that if success is false,
    // some other dialog might be opened when the dialog is closed.
    onClose?: (success: boolean) => void;
  };

  @property() public esploader!: ESPLoader;
  @property() public stream?: ReadableStream;

  @query("install-console") private _console!: InstallConsole;

  @state() private _writeProgress?: number;

  @state() private _state:
    | "connecting_webserial"
    | "prepare_installation"
    | "installing"
    | "done" = "connecting_webserial";

  @state() private _error?: string | TemplateResult;

  private _platform?: ValueOf<typeof chipFamilyToPlatform>;

  @property() private _showLogs = false;

  connectedCallback() {
    super.connectedCallback();

    // this._console won't be defined until after the first paint
    setTimeout(() => {
      this.stream?.pipeTo(
        new WritableStream({
          write: (chunk) => {
            this._console.addLine(chunk);
          },
        }),
      );
    });
  }

  protected render() {
    let heading;
    let content;
    let hideActions = false;

    if (this._state === "connecting_webserial") {
      content = this._renderProgress("Connecting");
      hideActions = true;
    } else if (this._state === "prepare_installation") {
      content = this._renderProgress("Preparing installation");
      hideActions = true;
    } else if (this._state === "installing") {
      content =
        this._writeProgress === undefined
          ? this._renderProgress("Erasing")
          : this._renderProgress(
              html`
                Installing<br /><br />
                This will take
                ${this._platform === "ESP8266" ? "a minute" : "2 minutes"}.<br />
                Keep this page visible to prevent slow down
              `,
              // Show as undeterminate under 3% or else we don't show any pixels
              this._writeProgress > 3 ? this._writeProgress : undefined,
            );
      hideActions = true;
    } else if (this._state === "done") {
      if (this._error) {
        content = content = html`
          ${this._renderMessage(WARNING_ICON, this._error, false)}
          <mwc-button
            slot="secondaryAction"
            dialogAction="ok"
            label="Close"
          ></mwc-button>
          <mwc-button
            slot="primaryAction"
            label="Retry"
            @click=${this._handleRetry}
          ></mwc-button>
        `;
      } else {
        content = this._renderMessage(
          OK_ICON,
          `Configuration installed!`,
          true,
        );
      }
    }

    hideActions = false;

    return html`
      <mwc-dialog
        open
        heading=${heading}
        scrimClickAction
        @closed=${this._handleClose}
        .hideActions=${hideActions}
      >
        ${content}
        <install-console
          class="${this._showLogs ? "" : "hidden"}"
        ></install-console>
        <mwc-button
          slot="secondaryAction"
          @click=${this._toggleLogs}
          label="${this._showLogs ? "Hide" : "Show"} Logs"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  _renderProgress(label: string | TemplateResult, progress?: number) {
    return html`
      <div class="center">
        <div>
          <mwc-circular-progress
            active
            ?indeterminate=${progress === undefined}
            .progress=${progress !== undefined ? progress / 100 : undefined}
            density="8"
          ></mwc-circular-progress>
          ${progress !== undefined
            ? html`<div class="progress-pct">${progress}%</div>`
            : ""}
        </div>
        ${label}
      </div>
    `;
  }

  _renderMessage(
    icon: string,
    label: string | TemplateResult,
    showClose: boolean,
  ) {
    return html`
      <div class="center">
        <div class="icon">${icon}</div>
        ${label}
      </div>
      ${showClose || true
        ? html`
            <mwc-button
              slot="primaryAction"
              dialogAction="ok"
              label="Close"
            ></mwc-button>
          `
        : ""}
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._handleInstall();
  }

  private _openCompileDialog() {
    openCompileDialog(this.params.configuration!, true);
    this._close();
  }

  private _handleRetry() {
    openInstallWebDialog(this.params, () => this._close());
  }

  private async _handleInstall() {
    const esploader = this.esploader;
    esploader.transport.device.addEventListener("disconnect", async () => {
      this._state = "done";
      this._error = "Device disconnected";
      if (!this.params.port) {
        await esploader.transport.device.close();
      }
    });

    try {
      try {
        await esploader.main();
        await esploader.flashId();
      } catch (err) {
        console.error(err);
        this._state = "done";
        this._error =
          "Failed to initialize. Try resetting your device or holding the BOOT button while selecting your serial port until it starts preparing the installation.";
        return;
      }

      this._platform = chipFamilyToPlatform[esploader.chip.CHIP_NAME];

      const filesCallback =
        this.params.filesCallback ||
        ((platform: ValueOf<typeof chipFamilyToPlatform>) =>
          this._getFilesForConfiguration(this.params.configuration!, platform));

      let files: FileToFlash[] | undefined = [];

      try {
        files = await filesCallback(this._platform!);
      } catch (err) {
        this._state = "done";
        this._error = String(err);
        return;
      }

      // If getFilesForConfiguration already did some error handling.
      if (!files) {
        return;
      }

      this._state = "installing";

      try {
        await flashFiles(
          esploader,
          files,
          this.params.erase === true,
          (pct) => {
            this._writeProgress = pct;
          },
        );
      } catch (err) {
        // It is "done" if disconnected
        // @ts-ignore
        if (this._state !== "done") {
          this._error = `Installation failed: ${err}`;
          this._state = "done";
        }
        return;
      }

      await esploader.hardReset();
      this._state = "done";
    } finally {
      console.log("Closing port");
      try {
        await esploader.transport.disconnect();
        // If a port was passed in, we open it again
        if (this.params.port) {
          console.log("Reopening port");
          await sleep(1000);
          await this.params.port.open({
            baudRate: esploader.transport.baudrate,
          });
        }
      } catch (err) {
        // can happen if we already closed in disconnect
      }
    }
  }

  private async _getFilesForConfiguration(
    configuration: string,
    platform: ValueOf<typeof chipFamilyToPlatform>,
  ): Promise<FileToFlash[] | undefined> {
    let info: Configuration;

    try {
      info = await getConfiguration(configuration);
    } catch (err) {
      this._state = "done";
      this._error = "Error fetching configuration information";
      return;
    }

    if (platform !== info.esp_platform.toUpperCase()) {
      this._state = "done";
      this._error = `Configuration does not match the platform of the connected device. Expected an ${info.esp_platform.toUpperCase()} device.`;
      return;
    }

    this._state = "prepare_installation";

    try {
      await compileConfiguration(configuration);
    } catch (err) {
      this._error = html`
        Failed to prepare configuration<br /><br />
        <button class="link" @click=${this._openCompileDialog}>
          See what went wrong.
        </button>
      `;
      this._state = "done";
      return;
    }

    // It is "done" if disconnected while compiling
    // @ts-ignore
    if (this._state === "done") {
      return;
    }

    return await getConfigurationFiles(configuration);
  }

  private _toggleLogs() {
    this._showLogs = !this._showLogs;
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
      install-console {
        width: 500px;
        height: 300px;
        margin-top: 16px;
        overflow: hidden;
        transition: all 0.2s ease-in-out;
      }
      install-console.hidden {
        margin-top: 0;
        width: 230px;
        height: 0;
      }
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
      .progress-pct {
        position: absolute;
        top: 50px;
        left: 0;
        right: 0;
      }
      .icon {
        font-size: 50px;
        line-height: 80px;
        color: black;
      }
      .show-ports {
        margin-top: 16px;
      }
      .error {
        padding: 8px 24px;
        background-color: #fff59d;
        margin: 0 -24px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-install-web-dialog": ESPHomeInstallWebDialog;
  }
}
