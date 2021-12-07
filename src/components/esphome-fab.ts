import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-fab";
import { openWizardDialog } from "../wizard";

@customElement("esphome-fab")
export class ESPHomeFab extends LitElement {
  protected override render(): TemplateResult {
    return html`
      <mwc-fab
        extended
        icon="add"
        label="New device"
        @click=${this._handleClick}
      ></mwc-fab>
    `;
  }

  private _handleClick() {
    openWizardDialog();
  }

  static styles = css`
    mwc-fab {
      position: fixed;
      right: 23px;
      bottom: 23px;
      padding-top: 15px;
      margin-bottom: 0;
      z-index: 997;
      --mdc-theme-secondary: var(--alert-success-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-fab": ESPHomeFab;
  }
}
