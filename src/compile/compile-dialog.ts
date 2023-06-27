import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import "../components/process-dialog";
import { openCompileDialog } from ".";
import { getDownloadUrl } from "../api/configuration";
import { esphomeDialogStyles } from "../styles";

@customElement("esphome-compile-dialog")
class ESPHomeCompileDialog extends LitElement {
  @property() public configuration!: string;

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
              <a
                slot="secondaryAction"
                href="${getDownloadUrl(
                  this.configuration,
                  this.downloadFactoryFirmware
                )}"
              >
                <mwc-button label="Download"></mwc-button>
              </a>
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

    const link = document.createElement("a");
    link.download = this.configuration + ".bin";
    link.href = getDownloadUrl(
      this.configuration,
      this.downloadFactoryFirmware
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private _handleRetry() {
    openCompileDialog(this.configuration, this.downloadFactoryFirmware);
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
