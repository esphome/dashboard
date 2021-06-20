import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "../components/remote-process";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-process-dialog")
export class ESPHomeProcessDialog extends LitElement {
  @property() public heading!: string;
  @property() public spawnParams?: Record<string, any>;
  @property() public type!: string;

  @state() private _result?: number;

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
          .spawnParams=${this.spawnParams}
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
    this._result = ev.detail;
  }

  private _handleClose() {
    fireEvent(this, "closed");
  }

  static styles = css`
    mwc-dialog {
      --mdc-dialog-min-width: 95vw;
      --mdc-dialog-max-width: 95vw;
      --mdc-theme-primary: #03a9f4;
    }

    esphome-remote-process {
      --remote-process-height: calc(90vh - 128px);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-process-dialog": ESPHomeProcessDialog;
  }
}
