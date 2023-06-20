import { LitElement, html, PropertyValues, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "../components/remote-process";
import "../components/process-dialog";
import { openLogsDialog } from "../logs";
import { getSerialPorts, ServerSerialPort } from "../api/serial-ports";
import { allowsWebSerial, metaChevronRight, supportsWebSerial } from "../const";
import { openLogsWebSerialDialog } from "../logs-webserial";
import { esphomeDialogStyles, esphomeSvgStyles } from "../styles";

const ESPHOME_WEB_URL = "https://web.esphome.io/?dashboard_logs";

@customElement("esphome-logs-target-dialog")
class ESPHomeLogsTargetDialog extends LitElement {
  @property() public configuration!: string;

  @state() private _ports?: ServerSerialPort[];

  @state() private _show: "options" | "web_instructions" | "server_ports" =
    "options";

  protected render() {
    let heading;
    let content;

    if (this._show === "options") {
      heading = "How to get the logs for your device?";
      content = html`
        <mwc-list-item
          twoline
          hasMeta
          dialogAction="close"
          .port=${"OTA"}
          @click=${this._pickPort}
        >
          <span>Wirelessly</span>
          <span slot="secondary">Requires the device to be online</span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item
          twoline
          hasMeta
          .port=${"WEBSERIAL"}
          @click=${this._pickWebSerial}
        >
          <span>Plug into this computer</span>
          <span slot="secondary">
            For devices connected via USB to this computer
          </span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item twoline hasMeta @click=${this._showServerPorts}>
          <span>Plug into computer running ESPHome Dashboard</span>
          <span slot="secondary">
            For devices connected via USB to the server
          </span>
          ${metaChevronRight}
        </mwc-list-item>
        <mwc-button
          no-attention
          slot="primaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>
      `;
    } else if (this._show === "web_instructions") {
      heading = "View logs in the browser";
      content = html`
        <div>
          ESPHome can view the logs of your device via the browser if certain
          requirements are met:
        </div>
        <ul>
          <li>ESPHome is visited over HTTPS</li>
          <li>Your browser supports WebSerial</li>
        </ul>
        <div>
          Not all requirements are currently met. The easiest solution is to
          view the logs with ESPHome Web. ESPHome Web works 100% in your browser
          and no data will be shared with the ESPHome project.
        </div>

        <a
          slot="primaryAction"
          href=${ESPHOME_WEB_URL}
          target="_blank"
          rel="noopener"
        >
          <mwc-button
            dialogAction="close"
            label="OPEN ESPHOME WEB"
          ></mwc-button>
        </a>
        <mwc-button
          no-attention
          slot="secondaryAction"
          label="Back"
          @click=${() => {
            this._show = "options";
          }}
        ></mwc-button>
      `;
    } else {
      heading = "Pick server port";
      content = html`${this._ports === undefined
          ? html`
              <mwc-list-item>
                <span>Loading ports…</span>
              </mwc-list-item>
            `
          : this._ports.length === 0
          ? html`
              <mwc-list-item>
                <span>No serial ports found.</span>
              </mwc-list-item>
            `
          : this._ports.map(
              (port) => html`
                <mwc-list-item
                  twoline
                  hasMeta
                  dialogAction="close"
                  .port=${port.port}
                  @click=${this._pickPort}
                >
                  <span>${port.desc}</span>
                  <span slot="secondary">${port.port}</span>
                  ${metaChevronRight}
                </mwc-list-item>
              `
            )}

        <mwc-button
          no-attention
          slot="primaryAction"
          label="Back"
          @click=${() => {
            this._show = "options";
          }}
        ></mwc-button>`;
    }

    return html`
      <mwc-dialog
        open
        heading=${heading}
        scrimClickAction
        @closed=${this._handleClose}
      >
        ${content}
      </mwc-dialog>
    `;
  }

  protected firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    getSerialPorts().then((ports) => {
      if (ports.length === 0 && !supportsWebSerial) {
        // Automatically pick wireless option if no other options available
        this._handleClose();
        openLogsDialog(this.configuration, "OTA");
      } else {
        this._ports = ports;
      }
    });
  }

  private _showServerPorts() {
    this._show = "server_ports";
  }

  private _pickPort(ev: Event) {
    openLogsDialog(this.configuration, (ev.currentTarget as any).port);
  }

  private async _pickWebSerial(ev: Event) {
    if (!supportsWebSerial || !allowsWebSerial) {
      this._show = "web_instructions";
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      this.shadowRoot!.querySelector("mwc-dialog")!.close();
      openLogsWebSerialDialog(port, true, this.configuration);
    } catch (err) {
      console.error(err);
    }
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
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-logs-target-dialog": ESPHomeLogsTargetDialog;
  }
}
