import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/process-dialog";
import { openRenameDialog } from "../rename";

@customElement("esphome-rename-process-dialog")
class ESPHomeRenameProcessDialog extends LitElement {
  @property() public configuration!: string;
  @property() public newName!: string;

  @state() private _result?: number;

  protected render() {
    return html`
      <esphome-process-dialog
        always-show-close
        .heading=${`Rename ${this.configuration}`}
        .type=${"rename"}
        .spawnParams=${{
          configuration: this.configuration,
          newName: `${this.newName}`,
        }}
        @closed=${this._handleClose}
        @process-done=${this._handleProcessDone}
      >
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

  private _handleProcessDone(ev: { detail: number }) {
    this._result = ev.detail;
  }

  private _handleRetry() {
    openRenameDialog(this.configuration, this.newName);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-rename-process-dialog": ESPHomeRenameProcessDialog;
  }
}
