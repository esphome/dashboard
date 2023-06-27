import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import "../components/process-dialog";
import { openInstallServerDialog } from ".";
import { openEditDialog } from "../editor";
import { esphomeDialogStyles } from "../styles";

@customElement("esphome-install-server-dialog")
class ESPHomeInstallServerDialog extends LitElement {
  @property() public configuration!: string;
  @property() public target!: string;

  @state() private _result?: number;

  protected render() {
    return html`
      <esphome-process-dialog
        .heading=${`Install ${this.configuration}`}
        .type=${"run"}
        .spawnParams=${{ configuration: this.configuration, port: this.target }}
        @closed=${this._handleClose}
        @process-done=${this._handleProcessDone}
      >
        ${this.target === "OTA"
          ? ""
          : html`
              <a
                href="https://esphome.io/guides/faq.html#i-can-t-get-flashing-over-usb-to-work"
                slot="secondaryAction"
                target="_blank"
                >❓</a
              >
            `}
        <mwc-button
          slot="secondaryAction"
          dialogAction="close"
          label="Edit"
          @click=${this._openEdit}
        ></mwc-button>
        ${this._result === undefined || this._result === 0
          ? ""
          : html`
              <mwc-button
                slot="secondaryAction"
                dialogAction="close"
                label="Retry"
                @click=${this._handleRetry}
              ></mwc-button>
            `}
      </esphome-process-dialog>
    `;
  }

  private _openEdit() {
    openEditDialog(this.configuration);
  }

  private _handleProcessDone(ev: { detail: number }) {
    this._result = ev.detail;
  }

  private _handleRetry() {
    openInstallServerDialog(this.configuration, this.target);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [
    esphomeDialogStyles,
    css`
      a[slot="secondaryAction"] {
        text-decoration: none;
        line-height: 32px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-install-server-dialog": ESPHomeInstallServerDialog;
  }
}
