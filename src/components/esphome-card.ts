import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("esphome-card")
export class ESPHomeCard extends LitElement {
  @property() public status?: string;

  @property({ attribute: "no-status-bar", reflect: true, type: Boolean })
  public noStatusBar = false;

  static styles = css`
    :host {
      background: var(--card-background-color, white);
      border-radius: 4px;
      box-shadow: var(
        --ha-card-box-shadow,
        0 2px 2px 0 rgba(0, 0, 0, 0.14),
        0 1px 5px 0 rgba(0, 0, 0, 0.12),
        0 3px 1px -2px rgba(0, 0, 0, 0.2)
      );
      color: var(--primary-text-color);
      display: block;
      position: relative;
      transition: all 0.3s ease;
    }

    :host(:hover) {
      box-shadow: var(
        --ha-card-box-shadow-hover,
        0 4px 8px 0 rgba(0, 0, 0, 0.12),
        0 2px 4px 0 rgba(0, 0, 0, 0.08)
      );
    }

    :host ::slotted(.card-header) {
      color: var(--primary-text-color);
      font-size: 16px;
      line-height: 20px;
      padding: 12px 16px;
      display: block;
      margin-block-start: 0px;
      margin-block-end: 0px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    :host ::slotted(.card-content:not(:first-child)),
    slot:not(:first-child)::slotted(.card-content) {
      padding-top: 0px;
      margin-top: -8px;
    }

    :host ::slotted(.card-content) {
      padding: 0px 16px 8px;
      font-size: 14px;
    }

    :host ::slotted(.card-actions) {
      border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
      padding: 4px 8px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
    }

    .status-bar {
      display: block;
      background-color: var(--status-color);
      color: var(--status-color);
      position: absolute;
      height: 4px;
      left: 0;
      right: 0;
      top: 0;
      border-top-left-radius: 4px;
      border-top-right-radius: 4px;
      transition: all 0.2s ease-in-out;
    }
    .status-bar::after {
      display: block;
      position: absolute;
      right: 8px;
      top: 8px;
      font-weight: bold;
      font-size: 11px;
      content: attr(data-status);
      color: var(--primary-text-color);
      background-color: var(--card-background-color);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--divider-color);
    }
    :host([no-status-bar]) .status-bar {
      height: 0px;
    }
    :host([no-status-bar]) .status-bar::after {
      display: none;
    }

    :host(.highlight) {
      animation: highlight 0.5s alternate infinite ease-in;
    }

    @keyframes highlight {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.05);
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      :host {
        --card-background-color: var(--ha-card-background, #1c1c1c);
        --divider-color: rgba(255, 255, 255, 0.12);
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
      ${this.status
        ? html`<div class="status-bar" data-status=${this.status}></div>`
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
