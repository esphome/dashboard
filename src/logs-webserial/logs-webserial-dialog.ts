import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "./ewt-console";

@customElement("esphome-logs-webserial-dialog")
class ESPHomeLogsWebSerialDialog extends LitElement {
  @property() public configuration?: string;

  @property() public port!: SerialPort;

  protected render() {
    return html`
      <mwc-dialog
        open
        .heading=${this.configuration ? `Logs ${this.configuration}` : "Logs"}
        scrimClickAction
        @closed=${this._handleClose}
      >
        <ewt-console
          .port=${this.port}
          .logger=${console}
          .allowInput=${false}
        ></ewt-console>
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
    const mod = await import("../legacy");
    mod.openEditDialog(this.configuration);
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
