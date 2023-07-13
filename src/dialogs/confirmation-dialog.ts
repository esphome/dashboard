import { LitElement, html, TemplateResult, CSSResultGroup, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import { ConfirmationDialogParams } from ".";
import { classMap } from "lit/directives/class-map.js";

@customElement("esphome-confirmation-dialog")
class ESPHomeConfirmationDialog extends LitElement {
  @state() private _params!: ConfirmationDialogParams;
  @state() private _resolve!: (value: boolean | PromiseLike<boolean>) => void;

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
        ${this._params.text ? html`<div>${this._params.text}</div>` : ""}
        <mwc-button
          slot="secondaryAction"
          no-attention
          .label=${this._params.dismissText || "Cancel"}
          dialogAction="dismiss"
        ></mwc-button>
        <mwc-button
          slot="primaryAction"
          .label=${this._params.confirmText || "Yes"}
          class=${classMap({
            destructive: this._params.destructive || false,
          })}
          dialogAction="confirm"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleClose(e: CustomEvent): void {
    this._resolve(e.detail.action === "confirm");
    this.parentNode!.removeChild(this);
  }

  static get styles(): CSSResultGroup {
    return css`
      mwc-button {
        --mdc-theme-primary: var(--primary-text-color);
      }

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
