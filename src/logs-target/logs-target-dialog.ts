import { LitElement, html, PropertyValues, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "../components/remote-process";
import "../components/process-dialog";
import { openLogsDialog } from "../logs";
import { getSerialPorts, SerialPort } from "../api/serial-ports";
import {
  allowsWebSerial,
  metaChevronRight,
  metaHelp,
  supportsWebSerial,
} from "../const";
import { openLogsWebSerialDialog } from "../logs-webserial";

@customElement("esphome-logs-target-dialog")
class ESPHomeLogsTargetDialog extends LitElement {
  @property() public configuration!: string;

  @state() private _ports?: SerialPort[];

  @state() private _show: "options" | "server_ports" = "options";

  protected render() {
    return html`
      <mwc-dialog
        open
        heading=${this._show === "options"
          ? "How to get the logs for your ESP device?"
          : "Pick server port"}
        scrimClickAction
        @closed=${this._handleClose}
      >
        ${this._show === "options"
          ? html`
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
            `
          : this._ports === undefined
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
          slot="secondaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>
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
      window.open(
        "https://esphome.io/guides/getting_started_hassio.html#webserial",
        "_blank"
      );
      return;
    }

    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      this.shadowRoot!.querySelector("mwc-dialog")!.close();
      openLogsWebSerialDialog(this.configuration, port);
    } catch (err) {
      console.error(err);
    }
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = css`
    mwc-list-item {
      margin: 0 -20px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-logs-target-dialog": ESPHomeLogsTargetDialog;
  }
}
