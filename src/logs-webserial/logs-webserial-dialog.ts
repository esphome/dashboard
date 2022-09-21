import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "./ewt-console";
import { textDownload } from "../util/file-download";
import type { EwtConsole } from "./ewt-console";
import { basename } from "../util/basename";
import { openEditDialog } from "../editor";

@customElement("esphome-logs-webserial-dialog")
class ESPHomeLogsWebSerialDialog extends LitElement {
  @property() public configuration?: string;

  @property() public port!: SerialPort;

  @property() public closePortOnClose!: boolean;

  @query("ewt-console") private _console!: EwtConsole;

  protected render() {
    return html`
      <mwc-dialog
        open
        .heading=${this.configuration ? `Logs ${this.configuration}` : "Logs"}
        scrimClickAction=""
        @closed=${this._handleClose}
      >
        <ewt-console
          .port=${this.port}
          .logger=${console}
          .allowInput=${false}
        ></ewt-console>
        <mwc-button
          slot="secondaryAction"
          label="Download Logs"
          @click=${this._downloadLogs}
        ></mwc-button>
        ${this.configuration
          ? html`
              <mwc-button
                slot="secondaryAction"
                dialogAction="close"
                label="Edit"
                @click=${this._openEdit}
              ></mwc-button>
            `
          : ""}
        <mwc-button
          slot="secondaryAction"
          label="Reset Device"
          @click=${this._resetDevice}
        ></mwc-button>
        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          label="Close"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private async _openEdit() {
    if (this.configuration) openEditDialog(this.configuration);
  }

  private async _handleClose() {
    await this._console.disconnect();
    if (this.closePortOnClose) {
      await this.port.close();
    }
    this.parentNode!.removeChild(this);
  }

  private async _resetDevice() {
    await this._console.reset();
  }

  private _downloadLogs() {
    textDownload(
      this._console.logs(),
      `${
        this.configuration ? `${basename(this.configuration)}_logs` : "logs"
      }.txt`
    );
  }

  static styles = css`
    mwc-dialog {
      --mdc-dialog-max-width: 90vw;
    }
    ewt-console {
      width: calc(80vw - 48px);
      height: calc(90vh - 128px);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-logs-webserial-dialog": ESPHomeLogsWebSerialDialog;
  }
}
