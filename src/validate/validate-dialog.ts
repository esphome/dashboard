// On pick and it's OTA or serial on host
// Then set window.SELECTED_UPLOAD_PORT to a string.

import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "../components/remote-process";
import { openInstallDialog } from "../install-update";
import { openEditDialog } from "../legacy";

@customElement("esphome-validate-dialog")
class ESPHomeValidateDialog extends LitElement {
  @state() public filename!: string;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading=${`Validate ${this.filename}`}
        scrimClickAction
        @closed=${this._handleClose}
      >
        <esphome-remote-process
          .type=${"validate"}
          .filename=${this.filename}
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

  private async _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = css`
    :host {
      --mdc-dialog-min-height: 85%;
      --mdc-dialog-max-height: 85%;
      --mdc-dialog-min-width: 95%;
      --mdc-dialog-max-width: 95%;
      --mdc-theme-primary: #03a9f4;
    }
    a {
      color: var(--mdc-theme-primary);
    }
    mwc-button[no-attention] {
      --mdc-theme-primary: #444;
      --mdc-theme-on-primary: white;
    }
    mwc-list-item {
      margin: 0 -20px;
    }
    svg {
      fill: currentColor;
    }
    .center {
      text-align: center;
    }
    mwc-circular-progress {
      margin-bottom: 16px;
    }
    .progress-pct {
      position: absolute;
      top: 50px;
      left: 0;
      right: 0;
    }
    .icon {
      font-size: 50px;
      line-height: 80px;
      color: black;
    }
    button.link {
      background: none;
      color: var(--mdc-theme-primary);
      border: none;
      padding: 0;
      font: inherit;
      text-align: left;
      text-decoration: underline;
      cursor: pointer;
    }
    .show-ports {
      margin-top: 16px;
    }
    .error {
      padding: 8px 24px;
      background-color: #fff59d;
      margin: 0 -24px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-validate-dialog": ESPHomeValidateDialog;
  }
}
