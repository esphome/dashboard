import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "@material/mwc-checkbox";
import "@material/mwc-formfield";
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

  @property({ type: Boolean, attribute: "show-states-toggle" })
  public showStatesToggle = false;

  @property({ type: Boolean, attribute: "show-states" })
  public showStates = true;

  @state() private _result?: number;

  protected render() {
    return html`
      <mwc-dialog
        open
        hideActions
        heading=${this.heading}
        scrimClickAction
        @closed=${this._handleClose}
      >
        <div class="body">
          <esphome-remote-process
            .type=${this.type}
            .spawnParams=${this.spawnParams}
            @process-done=${this._handleProcessDone}
          ></esphome-remote-process>

          <div class="action-row" @click=${this._handleActionRowClick}>
            ${this.showStatesToggle
              ? html`
                  <mwc-formfield label="Show entity state changes">
                    <mwc-checkbox
                      ?checked=${this.showStates}
                      @change=${this._onToggleShowStates}
                    ></mwc-checkbox>
                  </mwc-formfield>
                `
              : ""}
            <span class="spacer"></span>
            <mwc-button
              label="Download Logs"
              @click=${this._downloadLogs}
            ></mwc-button>
            <slot name="secondaryAction"></slot>
            <mwc-button
              @click=${this._closeDialog}
              .label=${this._result === undefined && !this.alwaysShowClose
                ? "Stop"
                : "Close"}
            ></mwc-button>
          </div>
        </div>
      </mwc-dialog>
    `;
  }

  private _closeDialog() {
    this.shadowRoot?.querySelector("mwc-dialog")?.close();
  }

  // mwc-dialog's built-in dialogAction click delegation only walks closest()
  // from mdcRoot's listener, which can't reach slotted buttons now that we
  // render the action row in the content slot. Mirror the behaviour here so
  // existing `dialogAction="close"` buttons keep closing the dialog.
  private _handleActionRowClick(ev: MouseEvent) {
    const target = ev.target as Element | null;
    if (target?.closest("[dialogAction]")) {
      this._closeDialog();
    }
  }

  public restart() {
    this._result = undefined;
    this.shadowRoot?.querySelector("esphome-remote-process")?.restart();
  }

  private _onToggleShowStates(ev: Event) {
    const checked = (ev.target as HTMLInputElement).checked;
    fireEvent(this, "show-states-changed", checked);
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
      filename,
    );
  }

  static styles = [
    esphomeDialogStyles,
    css`
      :host {
        /* Header height (~64px). mwc-dialog's hardcoded content padding
           (20px top + 20px bottom) is absorbed by the .body negative margin
           below, and hideActions removes the 52px footer. */
        --height-header-footer-padding: 80px;
      }
      mwc-dialog {
        --mdc-dialog-min-width: 95vw;
        --mdc-dialog-max-width: 95vw;
      }

      .body {
        display: flex;
        flex-direction: column;
        height: calc(90vh - var(--height-header-footer-padding));
        /* Cancel mwc-dialog's hardcoded 20px top/bottom content padding. */
        margin: -20px 0;
      }
      esphome-remote-process {
        flex: 1;
        min-height: 0;
      }
      .action-row {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        width: 100%;
      }
      .spacer {
        flex: 1 1 auto;
      }

      @media only screen and (max-width: 450px) {
        .body {
          height: calc(
            90vh - var(--height-header-footer-padding) - env(
                safe-area-inset-bottom
              )
          );
        }
        esphome-remote-process {
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
