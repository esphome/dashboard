import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import "../components/process-dialog";
import { openCompileDialog } from ".";
import { openDownloadTypeDialog } from "../download-type";
import { esphomeDialogStyles } from "../styles";

@customElement("esphome-compile-dialog")
class ESPHomeCompileDialog extends LitElement {
  @property() public configuration!: string;
  @property() public platformSupportsWebSerial!: boolean;

  @property() public downloadFactoryFirmware = true;

  @state() private _result?: number;

  protected render() {
    return html`
      <esphome-process-dialog
        .heading=${`Download ${this.configuration}`}
        .type=${"compile"}
        .spawnParams=${{ configuration: this.configuration }}
        @closed=${this._handleClose}
        @process-done=${this._handleProcessDone}
      >
        ${this._result === undefined
          ? ""
          : this._result === 0
            ? html`
                <mwc-button
                  slot="secondaryAction"
                  label="Download"
                  @click=${this._handleDownload}
                ></mwc-button>
              `
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

  private _handleProcessDone(ev: { detail: number }) {
    this._result = ev.detail;

    if (ev.detail !== 0) {
      return;
    }

    openDownloadTypeDialog(this.configuration, this.platformSupportsWebSerial);
  }

  private _handleDownload() {
    openDownloadTypeDialog(this.configuration, this.platformSupportsWebSerial);
  }

  private _handleRetry() {
    openCompileDialog(this.configuration, this.platformSupportsWebSerial);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [
    esphomeDialogStyles,
    css`
      a {
        text-decoration: none;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-compile-dialog": ESPHomeCompileDialog;
  }
}
