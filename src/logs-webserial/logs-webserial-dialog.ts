import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-list/mwc-list-item.js";
import "../components/remote-process";
import { openEditDialog } from "../legacy";
import "../components/process-dialog";
import "./ewt-console";

@customElement("esphome-logs-webserial-dialog")
class ESPHomeLogsWebSerialDialog extends LitElement {
  @property() public configuration!: string;

  @property() public port!: SerialPort;

  protected render() {
    return html`
      <mwc-dialog
        open
        .heading=${`Logs ${this.configuration}`}
        scrimClickAction
        @closed=${this._handleClose}
      >
        <ewt-console
          .port=${this.port}
          .logger=${console}
          .allowInput=${false}
        ></ewt-console>
        <mwc-button
          slot="secondaryAction"
          dialogAction="close"
          label="Edit"
          @click=${this._openEdit}
        ></mwc-button>
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

  private _openEdit() {
    openEditDialog(this.configuration);
  }

  private async _handleClose() {
    await this.shadowRoot!.querySelector("ewt-console")!.disconnect();
    await this.port.close();
    this.parentNode!.removeChild(this);
  }

  private async _resetDevice() {
    await this.shadowRoot!.querySelector("ewt-console")!.reset();
  }

  static styles = css`
    mwc-dialog {
      --mdc-dialog-max-width: 90vw;
    }
    ewt-console {
      display: block;
      width: calc(80vw - 48px);
      height: 80vh;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-logs-webserial-dialog": ESPHomeLogsWebSerialDialog;
  }
}
