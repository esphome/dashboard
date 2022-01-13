import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "../../../src/components/esphome-card";
import { esphomeCardStyles } from "../../../src/styles";

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
      </esphome-card>
    `;
  }

  static styles = [
    esphomeCardStyles,
    css`
      esphome-card {
        --status-color: var(--alert-error-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-unsupported-card": EWUnsupportedCard;
  }
}
