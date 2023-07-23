import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";
import { fireEvent } from "../util/fire-event";
import { mdiIncognito } from "@mdi/js";

@customElement("streamer-warning")
export class ESPHomeStreamerWarning extends LitElement {

  protected render() {
    return html`
      <mwc-dialog
        open
        scrimClickAction=""
        @escapeKeyAction=${() => fireEvent(this, "closed", {action: "close"})}
        @closed=${(e: any) => fireEvent(this, "closed", {action: e.detail.action})}
      >
        <div class="dialog-content">
            <esphome-svg-icon .path=${mdiIncognito}></esphome-svg-icon> 
            <h3>Streamer mode enabled</h3>
            <p>Are you sure you want to disclose your secrets?</p>
        </div>
        <mwc-button
            slot="secondaryAction"
            label="Cancel"
            dialogAction="close"
        ></mwc-button>
        <mwc-button
            slot="primaryAction"
            label="Show Secrets"
            dialogAction="accept"
        ></mwc-button>
      </<mwc-dialog>
    `;
  }

  static styles = css`
    .dialog-content {
        text-align: center;
        --mdc-theme-primary: var(--primary-text-color);
    }
    esphome-svg-icon {
        --mdc-icon-size: 56px;
    }
    mwc-button {
        --mdc-theme-primary: var(--primary-text-color);
    }
  `;

}  

declare global {
  interface HTMLElementTagNameMap {
    "streamer-warning": ESPHomeStreamerWarning;
  }
}
