import "@material/mwc-list/mwc-list-item";
import "@material/mwc-button";
import "@material/mwc-icon-button";
import type { ActionDetail } from "@material/mwc-list";
import { LitElement, html, css, PropertyValues } from "lit";
import { customElement } from "lit/decorators.js";
import "../../../src/components/esphome-svg-icon";
import "../../../src/components/esphome-card";
import "../../../src/components/esphome-button-menu";
import { fireEvent } from "../../../src/util/fire-event";
import {
  preloadLogsWebSerialDialog,
  openLogsWebSerialDialog,
} from "../../../src/logs-webserial";
import {
  preloadInstallUploadDialog,
  openInstallUploadDialog,
} from "../install-upload";
import {
  preloadInstallAdoptableDialog,
  openInstallAdoptableDialog,
} from "../install-adoptable";
import { esphomeCardStyles } from "../../../src/styles";
import { mdiLinkOff, mdiWifiCog } from "@mdi/js";

@customElement("ew-esp-device-card")
class EWESPDeviceCard extends LitElement {
  public port!: SerialPort;

  protected render() {
    return html`
      <esphome-card status="CONNECTED" no-status-bar>
        <div class="card-header">ESP Device</div>
        <div class="card-content flex"></div>

        <div class="card-actions">
          <mwc-button
            class="first-use"
            icon="system_update"
            label="Prepare for first use"
            @click=${this.showAdoptable}
          ></mwc-button>
          <mwc-button label="Install" @click=${this.showInstall}></mwc-button>
          <mwc-button label="Logs" @click=${this.showLogs}></mwc-button>
          <div class="flex"></div>
          <esphome-button-menu
            corner="BOTTOM_RIGHT"
            @action=${this._handleOverflowAction}
          >
            <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
            <mwc-list-item graphic="icon">
              Configure Wi-Fi
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiWifiCog}
              ></esphome-svg-icon>
            </mwc-list-item>
            <mwc-list-item graphic="icon">
              Disconnect
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiLinkOff}
              ></esphome-svg-icon>
            </mwc-list-item>
          </esphome-button-menu>
        </div>
      </esphome-card>
    `;
  }

  firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    preloadLogsWebSerialDialog();
    preloadInstallUploadDialog();
    preloadInstallAdoptableDialog();
  }

  private showLogs() {
    openLogsWebSerialDialog(this.port, false);
  }

  private showInstall() {
    openInstallUploadDialog(this.port);
  }

  private showAdoptable() {
    openInstallAdoptableDialog(this.port);
  }

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        import("improv-wifi-serial-sdk/dist/serial-provision-dialog");
        const improv = document.createElement(
          "improv-wifi-serial-provision-dialog"
        );
        improv.port = this.port;
        document.body.appendChild(improv);
        break;
      case 1:
        this.port.close();
        fireEvent(this, "close");
        break;
    }
  }

  static styles = [
    esphomeCardStyles,
    css`
      esphome-card {
        --status-color: var(--status-connected);
      }
      esphome-button-menu {
        --mdc-theme-text-icon-on-background: var(--primary-text-color);
      }
      mwc-button.first-use {
        --mdc-theme-primary: var(--update-available-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-esp-device-card": EWESPDeviceCard;
  }
}
