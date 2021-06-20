import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import { openEditDialog } from "../legacy";
import "../components/process-dialog";
import { openLogsDialog } from ".";

@customElement("esphome-logs-dialog")
class ESPHomeLogsDialog extends LitElement {
  @property() public configuration!: string;
  @property() public target!: string;

  @state() private _result?: number;

  protected render() {
    return html`
      <esphome-process-dialog
        .heading=${`Logs ${this.configuration}`}
        .type=${"logs"}
        .spawnParams=${{ configuration: this.configuration, port: this.target }}
        @closed=${this._handleClose}
        @process-done=${this._handleProcessDone}
      >
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
    openLogsDialog(this.configuration, this.target);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-logs-dialog": ESPHomeLogsDialog;
  }
}
