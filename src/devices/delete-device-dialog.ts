import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "../components/remote-process";
import "../components/process-dialog";
import { deleteConfiguration } from "../api/configuration";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-delete-device-dialog")
class ESPHomeDeleteDeviceDialog extends LitElement {
  @property() public name!: string;
  @property() public configuration!: string;

  protected render() {
    return html`
      <mwc-dialog
        .heading=${`Delete ${this.name}`}
        @closed=${this._handleClose}
        open
      >
        <div>Are you sure you want to delete ${this.name}?</div>
        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          @click=${this._handleDelete}
        >
          Confirm
        </mwc-button>
        <mwc-button slot="secondaryAction" dialogAction="cancel">
          Cancel
        </mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  private async _handleDelete() {
    await deleteConfiguration(this.configuration);
    fireEvent(this, "deleted");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-delete-device-dialog": ESPHomeDeleteDeviceDialog;
  }
}
