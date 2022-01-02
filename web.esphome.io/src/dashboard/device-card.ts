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
import {
  preloadInstallUploadDialog,
  openInstallUploadDialog,
} from "../install-upload";
import {
  preloadInstallAdoptableDialog,
  openInstallAdoptableDialog,
} from "../install-adoptable";

@customElement("ew-device-card")
class EWDeviceCard extends LitElement {
  public port!: SerialPort;

  protected render() {
    return html`
      <esphome-card status="CONNECTED" no-status-bar>
        <div class="card-header">ESP Device</div>
        <div class="card-content flex"></div>

        <div class="card-actions">
          <mwc-button
            label="Logs"
            @click=${this.showLogs}
          ></mwc-button>
          <mwc-button
            label="Install"
            @click=${this.showInstall}
          ></mwc-button>
          <mwc-button
            label="Prepare for adoption"
            @click=${this.showAdoptable}
          ></mwc-button>
          <div class="flex"></div>
          <esphome-button-menu
            corner="BOTTOM_RIGHT"
            @action=${this._handleOverflowAction}
          >
            <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
            <mwc-list-item>Disconnect</mwc-list-item>
          </esphome-button-menu>
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
    openLogsWebSerialDialog(this.port);
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
        this.port.close();
        fireEvent(this, "close");
        break;
    }
  }

  static styles = css`
    esphome-card {
      --status-color: rgba(0, 0, 0, 0.5);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    a {
      color: var(--mdc-theme-primary);
    }
    .card-actions {
      display: flex;
      padding: 4px;
    }
    .flex {
      flex: 1;
    }
    .card-actions a {
      text-decoration: none;
    }
    mwc-button {
      --mdc-theme-primary: rgba(0, 0, 0, 0.88);
    }
    esphome-button-menu {
      cursor: pointer;
    }
    mwc-icon-button {
      --mdc-icon-button-size: 32px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-device-card": EWDeviceCard;
  }
}
