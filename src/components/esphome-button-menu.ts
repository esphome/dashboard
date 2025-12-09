import "@material/mwc-menu";
import type { Corner, Menu } from "@material/mwc-menu";
import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";

@customElement("esphome-button-menu")
export class ESPHomeButtonMenu extends LitElement {
  @property() public corner: Corner = "TOP_START";

  @query("mwc-menu", true) private _menu?: Menu;

  @query(".trigger") private _trigger?: HTMLElement;

  public get items() {
    return this._menu?.items;
  }

  public get selected() {
    return this._menu?.selected;
  }

  protected render(): TemplateResult {
    return html`
      <div class="trigger" @click=${this._handleClick}>
        <slot name="trigger"></slot>
      </div>
      <mwc-menu
        .corner=${this.corner}
        .fixed=${true}
        .quick=${true}
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
    // Use the trigger element as anchor for better positioning
    this._menu!.anchor = this._trigger!;
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
    .trigger {
      display: inline-block;
    }
    mwc-menu {
      --mdc-theme-surface: var(--card-background-color);
      --mdc-theme-on-surface: var(--primary-text-color);
      --mdc-list-item-graphic-color: var(--primary-text-color);
      --mdc-menu-z-index: 9999;
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
