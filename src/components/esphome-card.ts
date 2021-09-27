import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("esphome-card")
export class ESPHomeCard extends LitElement {
  static styles = css`
    :host {
      background: var(--card-background-color, white);
      border-radius: 2px;
      box-shadow: 0 2px 2px 0 rgb(0 0 0 / 14%), 0 3px 1px -2px rgb(0 0 0 / 12%),
        0 1px 5px 0 rgb(0 0 0 / 20%);
      color: var(--primary-text-color);
      display: block;
      position: relative;
    }

    :host ::slotted(.card-header) {
      color: --primary-text-color;
      font-size: 24px;
      line-height: 32px;
      padding: 12px 16px 16px;
      display: block;
      margin-block-start: 0px;
      margin-block-end: 0px;
      font-weight: normal;
    }

    :host ::slotted(.card-content:not(:first-child)),
    slot:not(:first-child)::slotted(.card-content) {
      padding-top: 0px;
      margin-top: -8px;
    }

    :host ::slotted(.card-content) {
      padding: 16px;
    }

    :host ::slotted(.card-actions) {
      border-top: 1px solid var(--divider-color, #e8e8e8);
      padding: 5px 16px;
    }
  `;

  protected render(): TemplateResult {
    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-card": ESPHomeCard;
  }
}
