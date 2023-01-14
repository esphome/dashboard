import "@material/mwc-list/mwc-list-item";
import "@material/mwc-button";
import "@material/mwc-icon-button";
import type { ActionDetail } from "@material/mwc-list";
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement } from "lit/decorators.js";
import "../../../src/components/esphome-card";
import "../../../src/components/esphome-button-menu";
import { fireEvent } from "../../../src/util/fire-event";
import {
  preloadLogsWebSerialDialog,
  openLogsWebSerialDialog,
} from "../../../src/logs-webserial";
import { esphomeCardStyles } from "../../../src/styles";

@customElement("ew-pico-device-card")
class EWPicoDeviceCard extends LitElement {
  public port!: SerialPort;

  protected render() {
    return html`
      <esphome-card status="CONNECTED" no-status-bar>
        <div class="card-header">Raspberry Pi Pico W</div>
        <div class="card-content flex"></div>

        <div class="card-actions">
          <mwc-button label="Logs" @click=${this.showLogs}></mwc-button>
          <mwc-button
            label="Configure Wi-Fi"
            @click=${this.configureWiFi}
          ></mwc-button>
          <div class="flex"></div>
          <esphome-button-menu
            corner="BOTTOM_RIGHT"
            @action=${this._handleOverflowAction}
          >
            <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
            <mwc-list-item>Disconnect</mwc-list-item>
          </esphome-button-menu>
        </div>
      </esphome-card>
    `;
  }

  firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    preloadLogsWebSerialDialog();
    import("improv-wifi-serial-sdk/dist/serial-provision-dialog");
  }

  private showLogs() {
    openLogsWebSerialDialog(this.port, false);
  }

  private configureWiFi() {
    const improv = document.createElement(
      "improv-wifi-serial-provision-dialog"
    );
    improv.port = this.port;
    document.body.appendChild(improv);
  }

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this.port.close();
        fireEvent(this, "close");
        break;
    }
  }

  static styles = [
    esphomeCardStyles,
    css`
      esphome-card {
        --status-color: rgba(0, 0, 0, 0.5);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-pico-device-card": EWPicoDeviceCard;
  }
}
