import "@material/mwc-menu";
import type { Corner, Menu } from "@material/mwc-menu";
import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";

@customElement("esphome-button-menu")
export class ESPHomeButtonMenu extends LitElement {
  @property() public corner: Corner = "TOP_START";

  @query("mwc-menu", true) private _menu?: Menu;

  public get items() {
    return this._menu?.items;
  }

  public get selected() {
    return this._menu?.selected;
  }

  protected render(): TemplateResult {
    return html`
      <div @click=${this._handleClick}>
        <slot name="trigger"></slot>
      </div>
      <mwc-menu
        .corner=${"TOP_END" as Corner}
        .menuCorner=${"END"}
        .quick=${true}
        .fixed=${true}
        @action=${this._handleAction}
        @closed=${this._handleClosed}
      >
        <slot></slot>
      </mwc-menu>
    `;
  }

  private _handleClick(ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();

    // Get the bounding rect of this element for fixed positioning
    const rect = this.getBoundingClientRect();

    // Position menu below and to the right of the trigger
    // x = right edge of button, y = bottom of button
    this._menu!.x = rect.right;
    this._menu!.y = rect.bottom;
    this._menu!.anchor = null;
    this._menu!.show();
  }

  private _handleAction(ev: CustomEvent): void {
    // Re-dispatch the action event so it bubbles out of the shadow DOM
    this.dispatchEvent(
      new CustomEvent("action", {
        detail: ev.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  private _handleClosed(ev: Event): void {
    ev.stopPropagation();
  }

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }
    mwc-menu {
      --mdc-theme-surface: var(--card-background-color);
      --mdc-theme-on-surface: var(--primary-text-color);
      --mdc-list-item-graphic-color: var(--primary-text-color);
    }
    /* Force icon colors */
    ::slotted(mwc-list-item) {
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-button-menu": ESPHomeButtonMenu;
  }
}
