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
  @property({ attribute: false }) public device!: ImportableDevice;
  @property({ type: Boolean }) public highlightOnAdd = false;
  @property({ type: Boolean }) public skeleton = false;

  protected render() {
    if (this.skeleton || !this.device) {
      return html`
        <esphome-card class="skeleton">
          <div class="card-header">
            <div class="skeleton skeleton-text skeleton-effect-fade">
              ${" "}
            </div>
          </div>
          <div class="card-content flex">
            <div class="skeleton skeleton-text skeleton-effect-fade">
              ${" "} ${" "}
            </div>
          </div>
          <div class="card-actions">
            <mwc-button label="Visit" disabled></mwc-button>
            <mwc-button label="Edit" disabled></mwc-button>
            <mwc-button label="Logs" disabled></mwc-button>
            <div class="flex"></div>
            <esphome-button-menu corner="BOTTOM_RIGHT">
              <mwc-icon-button
                slot="trigger"
                icon="more_vert"
                disabled
              ></mwc-icon-button>
            </esphome-button-menu>
          </div>
        </esphome-card>
      `;
    }
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

      esphome-card.skeleton {
        min-height: 145px;
        /* skeleton animation on background */
        background: #eee;
        background: linear-gradient(
          110deg,
          #ececec 8%,
          #f5f5f5 18%,
          #ececec 33%
        );

        background-size: 200% 100%;
        animation: 1.5s shine linear infinite;
      }

      @keyframes shine {
        to {
          background-position-x: -200%;
        }
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
