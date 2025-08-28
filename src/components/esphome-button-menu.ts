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
      <mwc-menu .corner=${this.corner}>
        <slot></slot>
      </mwc-menu>
    `;
  }

  private _handleClick(ev: Event): void {
    ev.preventDefault();
    this._menu!.anchor = this;
    this._menu!.show();
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
