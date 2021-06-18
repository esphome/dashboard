import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "../components/remote-process";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-process-dialog")
export class ESPHomeProcessDialog extends LitElement {
  @property() public heading!: string;
  @property() public filename!: string;
  @property() public type!: string;

  private _result?: number;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading=${this.heading}
        scrimClickAction
        @closed=${this._handleClose}
      >
        <esphome-remote-process
          .type=${this.type}
          .filename=${this.filename}
          @process-done=${this._handleProcessDone}
        ></esphome-remote-process>

        <slot name="secondaryAction" slot="secondaryAction"></slot>

        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          .label=${this._result === undefined ? "Stop" : "Close"}
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleProcessDone(ev: { detail: number }) {
    fireEvent(this, "process-done", ev.detail);
    this._result = ev.detail;
  }

  private _handleClose() {
    fireEvent(this, "close");
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
    "esphome-process-dialog": ESPHomeProcessDialog;
  }
}
