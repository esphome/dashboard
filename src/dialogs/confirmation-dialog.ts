import { LitElement, html, TemplateResult, CSSResultGroup, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import { ConfirmationDialogParams } from ".";
import { classMap } from "lit/directives/class-map.js";

@customElement("esphome-confirmation-dialog")
class ESPHomeConfirmationDialog extends LitElement {
  @state() private _params?: ConfirmationDialogParams;

  public async showDialog(params: ConfirmationDialogParams): Promise<void> {
    this._params = params;
  }

  protected render(): TemplateResult {
    if (!this._params) {
      return html``;
    }
    return html`
      <mwc-dialog
        .heading=${this._params.title || ""}
        @closed=${this._handleClose}
        open
      >
        ${this._params.text && html`<div>${this._params.text}</div>`}
        <mwc-button
          slot="secondaryAction"
          no-attention
          .label=${this._params.dismissText || "Cancel"}
          @click=${this._dismiss}
        ></mwc-button>
        <mwc-button
          slot="primaryAction"
          .label=${this._params.confirmText || "Yes"}
          class=${classMap({
            destructive: this._params.destructive || false,
          })}
          dialogAction="close"
          @click=${this._confirm}
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleClose() {
    if (this._params!.cancel) {
      this._params!.cancel();
    }
    this.parentNode!.removeChild(this);
  }

  private async _confirm() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();

    if (this._params!.confirm) {
      this._params!.confirm();
    }
  }

  private async _dismiss() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();

    if (this._params!.cancel) {
      this._params!.cancel();
    }
  }

  static get styles(): CSSResultGroup {
    return css`
      .destructive {
        --mdc-theme-primary: var(--alert-error-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-confirmation-dialog": ESPHomeConfirmationDialog;
  }
}
