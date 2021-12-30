import { LitElement, html, PropertyValues, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
import { connect, ESPLoader } from "esp-web-flasher";
import {
  compileConfiguration,
  Configuration,
  getConfiguration,
} from "../api/configuration";
import { flashConfiguration } from "../flash";
import { openCompileDialog } from "../compile";
import { openInstallWebDialog } from ".";
import { chipFamilyToPlatform } from "../const";

const OK_ICON = "🎉";
const WARNING_ICON = "👀";

@customElement("esphome-install-web-dialog")
class ESPHomeInstallWebDialog extends LitElement {
  @property() public configuration!: string;

  @property() public esploader!: ESPLoader;

  @state() private _writeProgress = 0;

  @state() private _configuration?: Configuration;

  @state() private _state:
    | "connecting_webserial"
    | "prepare_installation"
    | "installing"
    | "done" = "connecting_webserial";

  @state() private _error?: string | TemplateResult;

  private _updateSerialInterval?: number;

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
      content = this._renderProgress(
        html`
          Installing<br /><br />
          This will take
          ${this._configuration!.esp_platform === "esp8266"
            ? "a minute"
            : "2 minutes"}.<br />
          Keep this page visible to prevent slow down
        `,
        // Show as undeterminate under 3% or else we don't show any pixels
        this._writeProgress > 3 ? this._writeProgress : undefined
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
          true
        );
      }
    }

    return html`
      <mwc-dialog
        open
        heading=${heading}
        scrimClickAction
        @closed=${this._handleClose}
        .hideActions=${hideActions}
      >
        ${content}
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
    showClose: boolean
  ) {
    return html`
      <div class="center">
        <div class="icon">${icon}</div>
        ${label}
      </div>
      ${showClose
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

  private _showCompileDialog() {
    openCompileDialog(this.configuration);
    this._close();
  }

  private async _handleRetry() {
    let esploader: ESPLoader;
    try {
      esploader = await connect(console);
    } catch (err) {
      // User aborted
      return;
    }

    openInstallWebDialog(this.configuration, esploader);
    this._close();
  }

  private async _handleInstall() {
    const esploader = this.esploader;

    esploader.port.addEventListener("disconnect", async () => {
      this._state = "done";
      this._error = "Device disconnected";
      await esploader.port.close();
    });

    try {
      try {
        this._configuration = await getConfiguration(this.configuration);
      } catch (err) {
        this._state = "done";
        this._error = "Error fetching configuration information";
        return;
      }

      const compileProm = compileConfiguration(this.configuration);

      try {
        await esploader.initialize();
      } catch (err) {
        console.error(err);
        this._state = "done";
        this._error = "Failed to initialize.";
        if (esploader.connected) {
          this._error +=
            " Try resetting your device or holding the BOOT button while selecting your serial port until it starts preparing the installation.";
        }
        return;
      }

      if (
        chipFamilyToPlatform[esploader.chipFamily] !==
        this._configuration.esp_platform.toUpperCase()
      ) {
        this._state = "done";
        this._error = `Configuration does not match the platform of the connected device. Expected an ${this._configuration.esp_platform.toUpperCase()} device.`;
        return;
      }

      this._state = "prepare_installation";

      try {
        await compileProm;
      } catch (err) {
        this._error = html`
          Failed to prepare configuration<br /><br />
          <button class="link" @click=${this._showCompileDialog}>
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

      this._state = "installing";

      try {
        await flashConfiguration(
          esploader,
          this.configuration,
          false,
          (pct) => {
            this._writeProgress = pct;
          }
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
      if (esploader.connected) {
        console.log("Disconnecting esp");
        await esploader.disconnect();
      }
      console.log("Closing port");
      try {
        await esploader.port.close();
      } catch (err) {
        // can happen if we already closed in disconnect
      }
    }
  }

  private _close() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }

  private async _handleClose() {
    if (this._updateSerialInterval) {
      clearTimeout(this._updateSerialInterval);
      this._updateSerialInterval = undefined;
    }
    this.parentNode!.removeChild(this);
  }

  static styles = css`
    a {
      color: var(--mdc-theme-primary);
    }
    mwc-button[no-attention] {
      --mdc-theme-primary: #444;
      --mdc-theme-on-primary: white;
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
    button.link {
      background: none;
      color: var(--mdc-theme-primary);
      border: none;
      padding: 0;
      font: inherit;
      text-align: left;
      text-decoration: underline;
      cursor: pointer;
    }
    .show-ports {
      margin-top: 16px;
    }
    .error {
      padding: 8px 24px;
      background-color: #fff59d;
      margin: 0 -24px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-install-web-dialog": ESPHomeInstallWebDialog;
  }
}
