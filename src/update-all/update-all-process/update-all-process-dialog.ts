import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-button";
import "../../components/remote-process";
import "../../components/process-dialog";

@customElement("esphome-update-all-process-dialog")
class ESPHomeUpdateAllProcessDialog extends LitElement {
  protected render() {
    return html`
      <esphome-process-dialog
        heading="Update All"
        .type=${"update-all"}
        @closed=${this._handleClose}
      ></esphome-process-dialog>
    `;
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-update-all-process-dialog": ESPHomeUpdateAllProcessDialog;
  }
}
