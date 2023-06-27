import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import { openInstallChooseDialog } from "../install-choose";
import "../components/process-dialog";
import { openEditDialog } from "../editor";
import { esphomeDialogStyles } from "../styles";

@customElement("esphome-validate-dialog")
class ESPHomeValidateDialog extends LitElement {
  @property() public configuration!: string;

  @state() private _valid?: boolean;

  protected render() {
    const valid_icon =
      this._valid === undefined ? "" : this._valid ? "✅" : "❌";
    return html`
      <esphome-process-dialog
        .heading=${`Validate ${this.configuration} ${valid_icon}`}
        .type=${"validate"}
        .spawnParams=${{ configuration: this.configuration }}
        @closed=${this._handleClose}
        @process-done=${this._handleProcessDone}
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

  private _handleProcessDone(ev: { detail: number }) {
    this._valid = ev.detail == 0;
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [esphomeDialogStyles];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-validate-dialog": ESPHomeValidateDialog;
  }
}
