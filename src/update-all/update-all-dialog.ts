import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import { openUpdateAllProcessDialog } from "./update-all-process";

@customElement("esphome-update-all-dialog")
class ESPHomeUpdateAllDialog extends LitElement {
  @property() public name!: string;
  @property() public configuration!: string;

  protected render() {
    return html`
      <mwc-dialog heading="Update All" @closed=${this._handleClose} open>
        <div>Do you want to update all devices?</div>
        <mwc-button
          slot="primaryAction"
          label="Update All"
          dialogAction="close"
          @click=${this._handleUpdateAll}
        ></mwc-button>
        <mwc-button
          slot="secondaryAction"
          no-attention
          label="Cancel"
          dialogAction="cancel"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  private async _handleUpdateAll() {
    openUpdateAllProcessDialog();
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-update-all-dialog": ESPHomeUpdateAllDialog;
  }
}
