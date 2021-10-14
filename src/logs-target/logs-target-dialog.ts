import { LitElement, html, PropertyValues, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "../components/remote-process";
import "../components/process-dialog";
import { openLogsDialog } from "../logs";
import { getSerialPorts, SerialPort } from "../api/serial-ports";
import { metaChevronRight } from "../const";

@customElement("esphome-logs-target-dialog")
class ESPHomeLogsTargetDialog extends LitElement {
  @property() public configuration!: string;

  @state() private _ports?: SerialPort[];

  protected render() {
    if (!this._ports) {
      return html``;
    }

    return html`
      <mwc-dialog
        open
        heading=${"Show Logs"}
        scrimClickAction
        @closed=${this._handleClose}
      >
        <mwc-list-item
          twoline
          hasMeta
          dialogAction="close"
          .port=${"OTA"}
          @click=${this._pickPort}
        >
          <span>Connect wirelessly</span>
          <span slot="secondary">Requires the device to be online</span>
          ${metaChevronRight}
        </mwc-list-item>

        ${this._ports.map(
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

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    getSerialPorts().then((ports) => {
      if (ports.length === 0) {
        // Automatically pick wireless option if no ports are found
        this._handleClose();
        openLogsDialog(this.configuration, "OTA");
      } else {
        this._ports = ports;
      }
    });
  }

  private _pickPort(ev: Event) {
    openLogsDialog(this.configuration, (ev.currentTarget as any).port);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = css`
    :host {
      --mdc-theme-primary: #03a9f4;
    }

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
