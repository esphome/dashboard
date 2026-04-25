import { LitElement, html } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-list/mwc-list-item.js";
import "../components/remote-process";
import { openEditDialog } from "../editor";
import "../components/process-dialog";
import type { ESPHomeProcessDialog } from "../components/process-dialog";
import { openLogsDialog } from ".";
import { esphomeDialogStyles } from "../styles";

const SHOW_STATES_STORAGE_KEY = "esphome-logs-show-states";

@customElement("esphome-logs-dialog")
class ESPHomeLogsDialog extends LitElement {
  @property() public configuration!: string;
  @property() public target!: string;

  @state() private _result?: number;
  @state() private _showStates: boolean =
    localStorage.getItem(SHOW_STATES_STORAGE_KEY) !== "false";

  @query("esphome-process-dialog")
  private _processDialog!: ESPHomeProcessDialog;

  protected render() {
    return html`
      <esphome-process-dialog
        always-show-close
        ?show-states-toggle=${this.target === "OTA"}
        .showStates=${this._showStates}
        .heading=${`Logs ${this.configuration}`}
        .type=${"logs"}
        .spawnParams=${{
          configuration: this.configuration,
          port: this.target,
          no_states: !this._showStates,
        }}
        @closed=${this._handleClose}
        @process-done=${this._handleProcessDone}
        @show-states-changed=${this._toggleShowStates}
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

  private async _toggleShowStates(ev: CustomEvent<boolean>) {
    this._showStates = ev.detail;
    localStorage.setItem(SHOW_STATES_STORAGE_KEY, String(this._showStates));
    this._result = undefined;
    // Wait for our render plus the inner process-dialog render so the new
    // spawnParams reach esphome-remote-process before we restart the stream.
    await this.updateComplete;
    await this._processDialog?.updateComplete;
    this._processDialog?.restart();
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [esphomeDialogStyles];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-logs-dialog": ESPHomeLogsDialog;
  }
}
