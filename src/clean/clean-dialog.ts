import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import { openInstallDialog } from "../install-update";
import { openEditDialog } from "../legacy";
import "../components/process-dialog";

@customElement("esphome-clean-dialog")
class ESPHomeCleanDialog extends LitElement {
  @property() public filename!: string;

  protected render() {
    return html`
      <esphome-process-dialog
        .heading=${`Clean ${this.filename}`}
        .type=${"clean"}
        .spawnParams=${{ configuration: this.filename }}
        @closed=${this._handleClose}
      >
        <mwc-button
          slot="secondaryAction"
          dialogAction="close"
          label="Edit"
          @click=${this._openEdit}
        ></mwc-button>
        <mwc-button
          slot="secondaryAction"
          dialogAction="close"
          label="Install"
          @click=${this._openInstall}
        ></mwc-button>
      </esphome-process-dialog>
    `;
  }

  private _openEdit() {
    openEditDialog(this.filename);
  }

  private _openInstall() {
    openInstallDialog(this.filename);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-clean-dialog": ESPHomeCleanDialog;
  }
}
