import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("esphome-card")
export class ESPHomeCard extends LitElement {
  @property() public status?: string;

  @property({ attribute: "no-status-bar", reflect: true, type: Boolean })
  public noStatusBar = false;

  static styles = css`
    :host {
      background: white;
      border-radius: 12px;
      border: var(--status-color) /* rgba(0, 0, 0, 0.12) */ 1px solid;
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

    :host(.highlight) {
      animation: highlight 0.5s alternate infinite ease-in;
    }

    .card-status-text {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 12px;
      line-height: 16px;
      color: var(--status-color);
      font-weight: bold;
      text-transform: uppercase;
    }

    @keyframes highlight {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.1);
      }
    }
  `;

  public async getAttention() {
    this.classList.add("highlight");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    this.classList.remove("highlight");
  }

  protected render(): TemplateResult {
    return html`
      ${this?.status !== undefined
        ? html`
            <div class="card-status-text">
              ${this.status !== "ONLINE" && this.status !== undefined
                ? this.status
                : ""}
            </div>
          `
        : ""}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-card": ESPHomeCard;
  }
}
