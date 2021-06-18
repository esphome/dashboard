// On pick and it's OTA or serial on host
// Then set window.SELECTED_UPLOAD_PORT to a string.

import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "../components/remote-process";
import { openInstallDialog } from "../install-update";
import { openEditDialog } from "../legacy";

@customElement("esphome-validate-dialog")
class ESPHomeValidateDialog extends LitElement {
  @property() public filename!: string;

  @state() private _valid?: boolean;

  protected render() {
    const valid_icon =
      this._valid === undefined ? "" : this._valid ? "✅" : "❌";
    return html`
      <mwc-dialog
        open
        heading=${`Validate ${this.filename} ${valid_icon}`}
        scrimClickAction
        @closed=${this._handleClose}
      >
        <esphome-remote-process
          .type=${"validate"}
          .filename=${this.filename}
          @process-done=${this._handleProcessDone}
        ></esphome-remote-process>

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
        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          label="Close"
        ></mwc-button>
      </mwc-dialog>
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

  static styles = css`
    mwc-dialog {
      --mdc-dialog-min-height: 85vh;
      --mdc-dialog-max-height: 85vh;
      --mdc-dialog-min-width: 95vw;
      --mdc-dialog-max-width: 95vw;
      --mdc-theme-primary: #03a9f4;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-validate-dialog": ESPHomeValidateDialog;
  }
}
