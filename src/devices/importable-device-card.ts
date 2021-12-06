import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ImportableDevice, importDevice } from "../api/devices";
import "@material/mwc-button";
import "../components/esphome-card";
import { fireEvent } from "../util/fire-event";
import { openAdoptDialog } from "../adopt";

@customElement("esphome-importable-device-card")
class ESPHomeImportableDeviceCard extends LitElement {
  @property() public device!: ImportableDevice;
  @property() public highlightOnAdd = false;

  protected render() {
    return html`
      <esphome-card status="DISCOVERED">
        <div class="card-header">${this.device.name}</div>
        <div class="card-content flex">${this.device.project_name}</div>

        <div class="card-actions">
          <mwc-button
            icon="file_download"
            label="Adopt"
            @click=${this._handleAdopt}
          ></mwc-button>
        </div>
      </esphome-card>
    `;
  }

  firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (!this.highlightOnAdd) {
      return;
    }
    setTimeout(() => {
      this.shadowRoot!.querySelector("esphome-card")!.getAttention();
    }, 1000);
  }

  static styles = css`
    esphome-card {
      --status-color: #4caf50;
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
  `;

  private async _handleAdopt() {
    openAdoptDialog(this.device, () => fireEvent(this, "adopted"));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-importable-device-card": ESPHomeImportableDeviceCard;
  }
}
