import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "../../../src/components/esphome-card";
import { DOCS_WEBSERIAL } from "../../../src/const";

@customElement("ew-unsupported-card")
class EWUnsupportedCard extends LitElement {
  protected render() {
    return html`
      <esphome-card status="UNSUPPORTED">
        <div class="card-header">Dashboard Unavailable</div>
        <div class="card-content flex">
          ESPHome Web requires a browser that supports WebSerial. Please open
          this website on your desktop using Google Chrome or Microsoft Edge.
        </div>

        <div class="card-actions">
          <a href=${DOCS_WEBSERIAL} target="_blank">
            <mwc-button icon="open_in_new" label="Learn more"></mwc-button>
          </a>
        </div>
      </esphome-card>
    `;
  }

  static styles = css`
    esphome-card {
      --status-color: var(--alert-error-color);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .flex {
      flex: 1;
    }
    .card-actions a {
      text-decoration: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-unsupported-card": EWUnsupportedCard;
  }
}
