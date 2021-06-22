// On pick and it's OTA or serial on host
// Then set window.SELECTED_UPLOAD_PORT to a string.

import {
  LitElement,
  html,
  PropertyValues,
  css,
  svg,
  TemplateResult,
} from "lit";
import { customElement, state } from "lit/decorators.js";
import { getSerialPorts, SerialPort } from "../api/serial-ports";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
// @ts-ignore
import { connect, ESPLoader } from "esp-web-flasher/dist/web";
import { allowsWebSerial, metaChevronRight, supportsWebSerial } from "../const";
import {
  compileConfiguration,
  Configuration,
  getConfiguration,
} from "../api/configuration";
import { flashConfiguration } from "../flash";
import { openInstallServerDialog } from "../install-server";
import { openCompileDialog } from "../compile";

const OK_ICON = "🎉";
const WARNING_ICON = "👀";

const metaHelp = svg`
  <svg width="24" height="24" viewBox="0 0 24 24" slot="meta">
    <path d="M11,18H13V16H11V18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,6A4,4 0 0,0 8,10H10A2,2 0 0,1 12,8A2,2 0 0,1 14,10C14,12 11,11.75 11,15H13C13,12.75 16,12.5 16,10A4,4 0 0,0 12,6Z" />
  </svg>
`;

@customElement("esphome-install-dialog")
class ESPHomeInstallDialog extends LitElement {
  @state() public configuration!: string;

  @state() private _ports?: SerialPort[];

  @state() private _writeProgress = 0;

  @state() private _configuration?: Configuration;

  @state() private _state:
    | "pick_option"
    | "pick_server_port"
    | "connecting_webserial"
    | "prepare_installation"
    | "installing"
    | "done" = "pick_option";

  @state() private _error?: string | TemplateResult;

  private _updateSerialInterval?: number;

  protected render() {
    let heading;
    let content;
    let hideActions = false;

    if (this._state === "pick_option") {
      heading = "How do you want to install this on your ESP device?";
      content = html`
        <mwc-list-item
          twoline
          hasMeta
          .port=${"OTA"}
          @click=${this._handleLegacyOption}
        >
          <span>Wirelessly</span>
          <span slot="secondary">Requires the device to be online</span>
          ${metaChevronRight}
        </mwc-list-item>

        ${this._error ? html`<div class="error">${this._error}</div>` : ""}

        <mwc-list-item twoline hasMeta @click=${this._handleBrowserInstall}>
          <span>Plug into this computer</span>
          <span slot="secondary">
            ${supportsWebSerial
              ? "For devices connected via USB to this computer"
              : allowsWebSerial
              ? "Your browser is not supported"
              : "Dashboard needs to opened via HTTPS"}
          </span>
          ${supportsWebSerial ? metaChevronRight : metaHelp}
        </mwc-list-item>

        <mwc-list-item twoline hasMeta @click=${this._showServerPorts}>
          <span>Plug into the computer running ESPHome Dashboard</span>
          <span slot="secondary">
            For devices connected via USB to the server
          </span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item twoline hasMeta @click=${this._showCompileDialog}>
          <span>Manual download</span>
          <span slot="secondary">
            Install it yourself using ESPHome Flasher or other tools
          </span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-button
          no-attention
          slot="secondaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>
      `;
    } else if (this._state === "pick_server_port") {
      heading = "Pick Server Port";
      content = html`
        ${this._ports!.map(
          (port) => html`
            <mwc-list-item
              twoline
              hasMeta
              .port=${port.port}
              @click=${this._handleLegacyOption}
            >
              <span>${port.desc}</span>
              <span slot="secondary">${port.port}</span>
              ${metaChevronRight}
            </mwc-list-item>
          `
        )}

        <mwc-button
          no-attention
          slot="secondaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>
      `;
    } else if (this._state === "connecting_webserial") {
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
          ${this._configuration!.esp_platform === "ESP8266"
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
        content = this._renderMessage(WARNING_ICON, this._error, true);
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
      ${showClose &&
      html`
        <mwc-button
          slot="primaryAction"
          dialogAction="ok"
          label="Close"
        ></mwc-button>
      `}
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._updateSerialPorts();
  }

  private async _updateSerialPorts() {
    this._ports = await getSerialPorts();
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has("_state") && this._state === "pick_server_port") {
      const updateAndSchedule = async () => {
        await this._updateSerialPorts();
        this._updateSerialInterval = window.setTimeout(async () => {
          await this._updateSerialPorts();
        }, 5000);
      };
      updateAndSchedule();
    }
  }

  private _showServerPorts() {
    // Set the min width to avoid the dialog shrinking
    this.style.setProperty(
      "--mdc-dialog-min-width",
      `${this.shadowRoot!.querySelector("mwc-list-item")!.clientWidth + 4}px`
    );
    this._state = "pick_server_port";
  }

  private _showCompileDialog() {
    openCompileDialog(this.configuration);
    this._close();
  }

  private _handleLegacyOption(ev: Event) {
    this._close();
    openInstallServerDialog(this.configuration, (ev.currentTarget as any).port);
  }

  private async _handleBrowserInstall() {
    if (!supportsWebSerial || !allowsWebSerial) {
      window.open(
        "https://esphome.io/guides/getting_started_hassio.html#webserial",
        "_blank"
      );
      return;
    }
    this._error = undefined;
    const configProm = getConfiguration(this.configuration);

    let esploader: ESPLoader;
    try {
      esploader = await connect(console);
    } catch (err) {
      // User aborted
      return;
    }

    try {
      try {
        this._configuration = await configProm;
      } catch (err) {
        this._state = "done";
        this._error = "Error fetching configuration information";
        return;
      }

      const compileProm = compileConfiguration(this.configuration);

      this._state = "connecting_webserial";

      try {
        await esploader.initialize();
      } catch (err) {
        console.error(err);
        this._state = "pick_option";
        this._error = "Failed to initialize.";
        if (esploader.connected) {
          this._error +=
            " Try resetting your device or holding the BOOT button while selecting your serial port until it starts preparing the installation.";
        }
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
        this._error = "Installation failed";
        this._state = "done";
        return;
      }

      await esploader.hardReset();
      this._state = "done";
    } finally {
      if (esploader?.connected) {
        console.log("Disconnecting esp");
        await esploader.disconnect();
      }
    }
  }

  private _close() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }

  private async _handleClose() {
    if (this._updateSerialInterval) {
      clearTimeout(this._updateSerialInterval);
    }
    this.parentNode!.removeChild(this);
  }

  static styles = css`
    :host {
      --mdc-theme-primary: #03a9f4;
    }
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
    "esphome-install-dialog": ESPHomeInstallDialog;
  }
}
