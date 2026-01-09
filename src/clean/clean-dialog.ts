import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import { openInstallChooseDialog } from "../install-choose";
import "../components/process-dialog";
import { openEditDialog } from "../editor";
import { esphomeDialogStyles } from "../styles";

@customElement("esphome-clean-dialog")
class ESPHomeCleanDialog extends LitElement {
  @property() public configuration!: string;

  protected render() {
    return html`
      <esphome-process-dialog
        .heading=${`Clean ${this.configuration}`}
        .type=${"clean"}
        .spawnParams=${{ configuration: this.configuration }}
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
    openEditDialog(this.configuration);
  }

  private _openInstall() {
    openInstallChooseDialog(this.configuration);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [esphomeDialogStyles];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-clean-dialog": ESPHomeCleanDialog;
  }
}
