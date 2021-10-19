import { css, html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import "./esphome-button-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import { openEditDialog } from "../legacy";
import { openUpdateAllDialog } from "../update-all";

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  protected render(): TemplateResult {
    return html`
      <esphome-button-menu
        corner="BOTTOM_START"
        @action=${this._handleOverflowAction}
      >
        <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
        <mwc-list-item>Update All</mwc-list-item>
        <mwc-list-item>Secrets Editor</mwc-list-item>
        <slot></slot>
      </esphome-button-menu>
    `;
  }

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        openUpdateAllDialog();
        break;
      case 1:
        openEditDialog("secrets.yaml");
        break;
    }
  }

  static styles = css`
    esphome-button-menu {
      z-index: 1;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-header-menu": ESPHomeHeaderMenu;
  }
}
