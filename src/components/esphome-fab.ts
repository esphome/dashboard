import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-fab";
import { openWizardDialog } from "../wizard";

@customElement("esphome-fab")
export class ESPHomeFab extends LitElement {
  protected override render(): TemplateResult {
    return html` <div class="fab-container">
      <mwc-fab extended icon="add" label="New device" @click=${this._handleClick}></mwc-fab>
    </div>`;
  }

  private _handleClick() {
    openWizardDialog();
  }

  static styles = css`
    .fab-container {
      position: absolute;
      bottom: 50px;
      right: 0;
      left: 0;
      display: flex;
      align-items: center;
      margin: auto;
      width: 90%;
      height: 100px;
      max-width: 1920px;
      justify-content: stretch;
      pointer-events: none;
    }

    mwc-fab {
      position: absolute;
      right: 0;
      bottom: 0;
      z-index: 997;
      --mdc-theme-secondary: #03a9f4;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-fab": ESPHomeFab;
  }
}
