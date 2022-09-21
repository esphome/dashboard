import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "../components/remote-process";
import { fireEvent } from "../util/fire-event";
import { esphomeDialogStyles } from "../styles";
import { textDownload } from "../util/file-download";
import { basename } from "../util/basename";

@customElement("esphome-process-dialog")
export class ESPHomeProcessDialog extends LitElement {
  @property() public heading!: string;
  @property() public spawnParams?: Record<string, any>;
  @property() public type!: string;

  @property({ type: Boolean, attribute: "always-show-close" })
  public alwaysShowClose = false;

  @state() private _result?: number;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading=${this.heading}
        scrimClickAction=""
        @closed=${this._handleClose}
      >
        <esphome-remote-process
          .type=${this.type}
          .spawnParams=${this.spawnParams}
          @process-done=${this._handleProcessDone}
        ></esphome-remote-process>

        <mwc-button
          slot="secondaryAction"
          label="Download Logs"
          @click=${this._downloadLogs}
        ></mwc-button>

        <slot name="secondaryAction" slot="secondaryAction"></slot>

        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          .label=${this._result === undefined && !this.alwaysShowClose
            ? "Stop"
            : "Close"}
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

  private _downloadLogs() {
    let filename = "logs";
    if (this.spawnParams?.configuration) {
      // Append filename without extension
      filename += `_${basename(this.spawnParams.configuration)}`;
    }
    filename += `_${this.type}.txt`;

    textDownload(
      this.shadowRoot!.querySelector("esphome-remote-process")!.logs(),
      filename
    );
  }

  static styles = [
    esphomeDialogStyles,
    css`
      :host {
        --height-header-footer-padding: 152px;
      }
      mwc-dialog {
        --mdc-dialog-min-width: 95vw;
        --mdc-dialog-max-width: 95vw;
      }

      esphome-remote-process {
        height: calc(90vh - var(--height-header-footer-padding));
      }

      @media only screen and (max-width: 450px) {
        esphome-remote-process {
          height: calc(
            90vh - var(--height-header-footer-padding) -
              env(safe-area-inset-bottom)
          );
          margin-left: -24px;
          margin-right: -24px;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-process-dialog": ESPHomeProcessDialog;
  }
}
