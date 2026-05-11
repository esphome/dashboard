import { LitElement, html, PropertyValues, css, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { until } from "lit/directives/until.js";
import { getSerialPorts, ServerSerialPort } from "../api/serial-ports";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
import { allowsWebSerial, metaChevronRight, supportsWebSerial } from "../const";
import { openInstallServerDialog } from "../install-server";
import { openCompileDialog } from "../compile";
import { openInstallWebDialog } from "../install-web";
import { compileConfiguration, getConfiguration } from "../api/configuration";
import { esphomeDialogStyles, esphomeSvgStyles } from "../styles";
import "../components/esphome-alert";
import { openDownloadTypeDialog } from "../download-type";
import { getFactoryDownloadUrl } from "../api/download";
import { cancelQueuedUpdate } from "../api/devices"; // Added for queue cancellation

const WARNING_ICON = "👀";
const ESPHOME_WEB_URL = "https://web.esphome.io/?dashboard_install";

@customElement("esphome-install-choose-dialog")
class ESPHomeInstallChooseDialog extends LitElement {
  @property() public configuration!: string;
  @property() public isQueued = false; // NEW: Receives queue status from device card

  @state() private _ethernet = false;
  @state() private _isPico = false;
  @state() private _shouldDownloadFactory = false;

  @state() private _ports?: ServerSerialPort[];

  @state() private _state: "choose" | "pick_port" = "choose";

  protected render() {
    return html`
      <mwc-dialog
        open
        heading="Install ${this.configuration}"
        @closed=${this._handleClose}
      >
        ${this._state === "choose" ? this._renderChoose() : this._renderPickPort()}
        <mwc-button slot="primaryAction" dialogAction="close">Cancel</mwc-button>
      </mwc-dialog>
    `;
  }

  private _renderChoose() {
    return html`
      <mwc-list>
        <mwc-list-item
          graphic="icon"
          twoline
          @click=${() => {
            openInstallServerDialog(this.configuration, "OTA");
            this._close();
          }}
        >
          <slot name="graphic">🌐</slot>
          <span>Wirelessly</span>
          <span slot="secondary">Requires the device to be online</span>
        </mwc-list-item>

        ${!this.isQueued
          ? html`
              <mwc-list-item
                graphic="icon"
                twoline
                @click=${this._openQueueDialog}
              >
                <slot name="graphic">⏳</slot>
                <span>Queue for Wake-up</span>
                <span slot="secondary">Build firmware and wait for device to connect</span>
              </mwc-list-item>
            `
          : html`
              <mwc-list-item
                graphic="icon"
                twoline
                @click=${this._handleCancelQueue}
              >
                <slot name="graphic">❌</slot>
                <span style="color: var(--alert-error-color);">Remove from Queue</span>
                <span slot="secondary">Cancel the pending ambush update</span>
              </mwc-list-item>
            `}

        ${this._ports === undefined || this._ports.length > 0
          ? html`
              <mwc-list-item
                graphic="icon"
                twoline
                @click=${() => {
                  this._state = "pick_port";
                }}
              >
                <slot name="graphic">🔌</slot>
                <span>Plugged into the computer running ESPHome Dashboard</span>
                <span slot="secondary">Install via USB</span>
              </mwc-list-item>
            `
          : ""}

        ${supportsWebSerial
          ? html`
              <mwc-list-item
                graphic="icon"
                twoline
                @click=${this._handleWebSerial}
              >
                <slot name="graphic">💻</slot>
                <span>Plug into this computer</span>
                <span slot="secondary">Install via USB from your browser</span>
              </mwc-list-item>
            `
          : ""}

        <mwc-list-item
          graphic="icon"
          twoline
          @click=${() => {
            openDownloadTypeDialog(this.configuration);
            this._close();
          }}
        >
          <slot name="graphic">⬇️</slot>
          <span>Manual download</span>
          <span slot="secondary">Install using ESPHome Web</span>
        </mwc-list-item>
      </mwc-list>
    `;
  }

  private _renderPickPort() {
    return html`
      <div class="show-ports">...</div>
    `;
  }

private async _openQueueDialog() {
    // 1. Force the browser to lazy-load and register the custom element
    await import("../install-web/install-web-dialog");

    // 2. Now that the browser knows what this element is, we can create it
    const dialog = document.createElement("esphome-install-web-dialog") as any;
    dialog.params = {
      configuration: this.configuration,
      isQueue: true,
    };
    document.body.appendChild(dialog);
    
    this._close();
  }

  private async _handleCancelQueue() {
    if (confirm(`Are you sure you want to cancel the queued update for ${this.configuration}?`)) {
      await cancelQueuedUpdate(this.configuration);
      this._close();
    }
  }

  private _handleWebSerial() {
    openInstallWebDialog({ configuration: this.configuration });
    this._close();
  }

  private _close() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [
    esphomeDialogStyles,
    esphomeSvgStyles,
    css`
      mwc-list-item {
        margin: 0 -20px;
      }
      .center {
        text-align: center;
      }
      .show-ports {
        margin-top: 16px;
      }
    `,
  ];
}
