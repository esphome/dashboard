import { LitElement, html, TemplateResult, CSSResultGroup, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import { ConfirmationDialogParams } from ".";
import { classMap } from "lit/directives/class-map.js";

@customElement("esphome-confirmation-dialog")
class ESPHomeConfirmationDialog extends LitElement {
  @state() private _params?: ConfirmationDialogParams;
  @state() private _resolve?: (value: boolean | PromiseLike<boolean>) => void;

  public async showDialog(
    params: ConfirmationDialogParams,
    resolve: (value: boolean | PromiseLike<boolean>) => void
  ): Promise<void> {
    this._params = params;
    this._resolve = resolve;
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
    if (!this._resolve) return;
    this._resolve(false);
    this.parentNode!.removeChild(this);
  }

  private async _confirm() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
    if (!this._resolve) return;
    this._resolve(true);
  }

  private async _dismiss() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
    if (!this._resolve) return;
    this._resolve(false);
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
