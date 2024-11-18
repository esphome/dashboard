import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { mdiFilter } from "@mdi/js";
import type { ActionDetail } from "@material/mwc-list";
import { ImportableDevice } from "../api/devices";
import "@material/mwc-button";
import "../components/esphome-card";
import { fireEvent } from "../util/fire-event";
import { openAdoptDialog } from "../adopt";
import { esphomeCardStyles } from "../styles";
import { ignoreDevice } from "../api/ignore";

@customElement("esphome-importable-device-card")
class ESPHomeImportableDeviceCard extends LitElement {
  @property() public device!: ImportableDevice;
  @property() public highlightOnAdd = false;

  protected render() {
    return html`
      <esphome-card
        .status=${this.device.ignored ? "IGNORED DISCOVERY" : "DISCOVERED"}
        ?ignored=${this.device.ignored}
      >
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
            label="Take Control"
            @click=${this._handleAdopt}
          ></mwc-button>
          <div class="flex"></div>
          <esphome-button-menu
            corner="BOTTOM_RIGHT"
            @action=${this._handleOverflowAction}
          >
            <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
            <mwc-list-item graphic="icon">
              ${this.device.ignored ? "Unignore" : "Ignore"}
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiFilter}
              ></esphome-svg-icon>
            </mwc-list-item>
          </esphome-button-menu>
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

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        ignoreDevice(this.device.name, !this.device.ignored).then(() =>
          fireEvent(this, "device-updated"),
        );
        break;
    }
  }

  static styles = [
    esphomeCardStyles,
    css`
      esphome-card {
        --status-color: var(--status-imported);
      }
      esphome-card[ignored] {
        --status-color: --mdc-theme-primary-no-attention;
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
    openAdoptDialog(this.device, () => fireEvent(this, "device-updated"));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-importable-device-card": ESPHomeImportableDeviceCard;
  }
}
