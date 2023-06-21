import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ImportableDevice } from "../api/devices";
import "@material/mwc-button";
import "../components/esphome-card";
import { fireEvent } from "../util/fire-event";
import { openAdoptDialog } from "../adopt";
import { esphomeCardStyles } from "../styles";

@customElement("esphome-importable-device-card")
class ESPHomeImportableDeviceCard extends LitElement {
  @property() public device!: ImportableDevice;
  @property() public highlightOnAdd = false;

  protected render() {
    return html`
      <esphome-card status="DISCOVERED">
        <div class="card-header">
          ${this.device.friendly_name || this.device.name}
        </div>
        <div class="card-content flex">
          ${this.device.friendly_name
            ? html`
                <div class="device-config-path tooltip-container">
                  <code class="inlinecode">${this.device.name}</code>
                </div>
              `
            : ""}
          ${this.device.project_name}
        </div>

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

  static styles = [
    esphomeCardStyles,
    css`
      esphome-card {
        --status-color: var(--status-imported);
      }
      .inlinecode {
        box-sizing: border-box;
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
          Courier, monospace;
      }
      .card-actions mwc-button {
        --mdc-theme-primary: #4caf50;
      }
    `,
  ];

  private async _handleAdopt() {
    openAdoptDialog(this.device, () => fireEvent(this, "adopted"));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-importable-device-card": ESPHomeImportableDeviceCard;
  }
}
