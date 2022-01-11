import { LitElement, html, PropertyValues, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { getSerialPorts, ServerSerialPort } from "../api/serial-ports";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
import { allowsWebSerial, metaChevronRight, supportsWebSerial } from "../const";
import { openInstallServerDialog } from "../install-server";
import { openCompileDialog } from "../compile";
import { openInstallWebDialog } from "../install-web";

const WARNING_ICON = "👀";
const ESPHOME_WEB_URL = "https://web.esphome.io/?dashboard_install";

@customElement("esphome-install-choose-dialog")
class ESPHomeInstallChooseDialog extends LitElement {
  @property() public configuration!: string;

  @state() private _ports?: ServerSerialPort[];

  @state() private _state:
    | "pick_option"
    | "web_instructions"
    | "pick_server_port" = "pick_option";

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
            For devices connected via USB to this computer
          </span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item twoline hasMeta @click=${this._showServerPorts}>
          <span>Plug into the computer running ESPHome Dashboard</span>
          <span slot="secondary">
            For devices connected via USB to the server
          </span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item
          twoline
          hasMeta
          dialogAction="close"
          @click=${this._showCompileDialog}
        >
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
      content =
        this._ports === undefined
          ? this._renderProgress("Loading serial devices")
          : this._ports.length === 0
          ? this._renderMessage(WARNING_ICON, "No serial devices found.", true)
          : html`
              ${this._ports.map(
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
    } else if (this._state === "web_instructions") {
      heading = "Install ESPHome via the browser";
      content = html`
        <p>
          ESPHome can install ${this.configuration} on your device via the
          browser if certain requirements are met:
        </p>
        <ul>
          <li>ESPHome is visited over HTTPS</li>
          <li>Your browser supports WebSerial</li>
        </ul>
        <p>
          Not all requirements are currently met. The easiest solution is to do
          the installation with
          <a href=${ESPHOME_WEB_URL} target="_blank" rel="noopener"
            >ESPHome Web</a
          >. ESPHome Web works 100% in your browser and no data will be shared
          with the ESPHome project.
        </p>
        <p>
          Press the DOWNLOAD button to download your project to use it with
          ESPHome Web.
        </p>

        <mwc-button
          no-attention
          slot="secondaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>

        <a
          slot="primaryAction"
          href=${ESPHOME_WEB_URL}
          target="_blank"
          rel="noopener"
          @click=${this._showCompileDialog}
        >
          <mwc-button dialogAction="close" label="Download"></mwc-button>
        </a>
      `;
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
    if (!changedProps.has("_state")) {
      return;
    }
    if (this._state === "pick_server_port") {
      const updateAndSchedule = async () => {
        await this._updateSerialPorts();
        this._updateSerialInterval = window.setTimeout(async () => {
          await updateAndSchedule();
        }, 5000);
      };
      updateAndSchedule();
    } else if (changedProps.get("_state") === "pick_server_port") {
      clearTimeout(this._updateSerialInterval);
      this._updateSerialInterval = undefined;
    }
  }

  private _storeDialogWidth() {
    // Set the min width to avoid the dialog shrinking
    this.style.setProperty(
      "--mdc-dialog-min-width",
      `${this.shadowRoot!.querySelector("mwc-list-item")!.clientWidth + 4}px`
    );
  }

  private _showServerPorts() {
    this._storeDialogWidth();
    this._state = "pick_server_port";
  }

  private _showCompileDialog() {
    openCompileDialog(this.configuration);
  }

  private _handleLegacyOption(ev: Event) {
    openInstallServerDialog(this.configuration, (ev.currentTarget as any).port);
    this._close();
  }

  private async _handleBrowserInstall() {
    if (!supportsWebSerial || !allowsWebSerial) {
      this._storeDialogWidth();
      this._state = "web_instructions";
      return;
    }

    if (await openInstallWebDialog({ configuration: this.configuration })) {
      this._close();
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
    "esphome-install-choose-dialog": ESPHomeInstallChooseDialog;
  }
}
