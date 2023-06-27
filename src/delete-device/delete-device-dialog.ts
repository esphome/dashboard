import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import { deleteConfiguration } from "../api/configuration";
import { fireEvent } from "../util/fire-event";
import { esphomeDialogStyles } from "../styles";

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
          class="warning"
          label="Delete"
          dialogAction="close"
          @click=${this._handleDelete}
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

  private async _handleDelete() {
    await deleteConfiguration(this.configuration);
    fireEvent(this, "deleted");
  }

  static styles = [
    esphomeDialogStyles,
    css`
      .warning {
        --mdc-theme-primary: var(--alert-error-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-delete-device-dialog": ESPHomeDeleteDeviceDialog;
  }
}
