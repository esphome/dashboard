import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ImportableDevice, importDevice } from "../api/devices";
import "@material/mwc-button";
import "../components/esphome-card";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-importable-device-card")
class ESPHomeImportableDeviceCard extends LitElement {
  @property() public device!: ImportableDevice;

  protected render() {
    return html`
      <esphome-card>
        <div class="status-bar"></div>
        <div class="card-header">${this.device.name}</div>
        <div class="card-content flex">${this.device.project_name}</div>

        <div class="card-actions">
          <mwc-button
            icon="file_download"
            label="Import"
            @click=${this._handleImport}
          ></mwc-button>
        </div>
      </esphome-card>
    `;
  }

  static styles = css`
    esphome-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .flex {
      flex: 1;
    }
    mwc-button {
      --mdc-theme-primary: #4caf50;
    }
    .status-bar {
      display: none;
      position: absolute;
      height: 4px;
      left: 0;
      right: 0;
      top: 0;
      border-top-left-radius: 2px;
      border-top-right-radius: 2px;
    }
    .status-bar::after {
      display: block;
      position: absolute;
      right: 4px;
      top: 5px;
      font-weight: bold;
      font-size: 12px;
    }
    .status-bar {
      display: block;
      background-color: #4caf50;
      color: #4caf50;
    }
    .status-bar::after {
      content: "DISCOVERED";
    }
  `;

  private async _handleImport() {
    await importDevice(this.device);
    fireEvent(this, "imported");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-importable-device-card": ESPHomeImportableDeviceCard;
  }
}
