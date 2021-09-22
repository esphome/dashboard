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
      <button @click=${this._handleClick}>
        <slot name="trigger"></slot>
      </button>
      <mwc-menu .corner=${this.corner}>
        <slot></slot>
      </mwc-menu>
    `;
  }

  private _handleClick(): void {
    this._menu!.anchor = this;
    this._menu!.show();
  }

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-button-menu": ESPHomeButtonMenu;
  }
}
