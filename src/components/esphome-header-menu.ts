import { css, html, LitElement, TemplateResult } from "lit";
import { property, state, customElement } from "lit/decorators.js";
import "./esphome-button-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import "@material/mwc-button";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import { openEditDialog } from "../editor";
import { SECRETS_FILE } from "../api/secrets";
import { openUpdateAllDialog } from "../update-all";
import { showConfirmationDialog } from "../dialogs";

const isWideListener = window.matchMedia("(min-width: 601px)");

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  @property({ type: String, attribute: "logout-url" }) logoutUrl?: string;

  @state() private _isWide = isWideListener.matches;

  protected render(): TemplateResult {
    if (this._isWide) {
      return html`
        <mwc-button
          icon="system_update"
          label="Update All"
          @click=${this._handleUpdateAll}
        ></mwc-button>
        <mwc-button
          icon="lock"
          label="Secrets"
          @click=${this._handleEditSecrets}
        ></mwc-button>
        ${this.logoutUrl
          ? html`
              <a href=${this.logoutUrl}
                ><mwc-button label="Log out"></mwc-button
              ></a>
            `
          : ""}
      `;
    }

    return html`
      <esphome-button-menu
        corner="BOTTOM_START"
        @action=${this._handleOverflowAction}
      >
        <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
        <mwc-list-item>Update All</mwc-list-item>
        <mwc-list-item>Secrets Editor</mwc-list-item>
        ${this.logoutUrl
          ? html`
              <a href=${this.logoutUrl}
                ><mwc-list-item>Log Out</mwc-list-item></a
              >
            `
          : ""}
        <slot></slot>
      </esphome-button-menu>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    isWideListener.addEventListener("change", this._isWideUpdated);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    isWideListener.removeEventListener("change", this._isWideUpdated);
  }

  private _isWideUpdated = () => {
    this._isWide = isWideListener.matches;
  };

  private async _handleUpdateAll() {
    if (
      !(await showConfirmationDialog({
        title: "Update All",
        text: "Do you want to update all devices?",
        confirmText: "Update All",
        dismissText: "Cancel",
      }))
    ) {
      return;
    }
    openUpdateAllDialog();
  }

  private _handleEditSecrets() {
    openEditDialog(SECRETS_FILE);
  }

  private async _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this._handleUpdateAll();
        break;
      case 1:
        this._handleEditSecrets();
        break;
    }
  }

  static styles = css`
    esphome-button-menu {
      z-index: 1;
    }
    mwc-button {
      --mdc-theme-primary: black;
      margin-left: 16px;
      line-height: 1em;
    }
    a {
      text-decoration: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-header-menu": ESPHomeHeaderMenu;
  }
}
