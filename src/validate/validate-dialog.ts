import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import { openInstallDialog } from "../install-update";
import { openEditDialog } from "../legacy";
import "../components/process-dialog";

@customElement("esphome-validate-dialog")
class ESPHomeValidateDialog extends LitElement {
  @property() public filename!: string;

  @state() private _valid?: boolean;

  protected render() {
    const valid_icon =
      this._valid === undefined ? "" : this._valid ? "✅" : "❌";
    return html`
      <esphome-process-dialog
        .heading=${`Validate ${this.filename} ${valid_icon}`}
        .type=${"validate"}
        .filename=${this.filename}
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
    openEditDialog(this.filename);
  }

  private _openInstall() {
    openInstallDialog(this.filename);
  }

  private _handleProcessDone(ev: { detail: number }) {
    this._valid = ev.detail == 0;
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-validate-dialog": ESPHomeValidateDialog;
  }
}
