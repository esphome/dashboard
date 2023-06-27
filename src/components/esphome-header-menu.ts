import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./esphome-button-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import "@material/mwc-button";
import "@material/mwc-icon";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import { openEditDialog, toggleSearch } from "../editor";
import { SECRETS_FILE } from "../api/secrets";
import { openUpdateAllDialog } from "../update-all";
import { showConfirmationDialog } from "../dialogs";

const isWideListener = window.matchMedia("(min-width: 641px)");

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
        <mwc-button class="search" @click=${this._handleSearch}>
          <mwc-icon>search</mwc-icon>
        </mwc-button>
      `;
    }

    return html`
      <esphome-button-menu
        corner="BOTTOM_START"
        @action=${this._handleOverflowAction}
      >
        <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
        <mwc-list-item graphic="icon"
          ><mwc-icon slot="graphic">search</mwc-icon>Search</mwc-list-item
        >
        <mwc-list-item graphic="icon"
          ><mwc-icon slot="graphic">system_update</mwc-icon>Update
          All</mwc-list-item
        >
        <mwc-list-item graphic="icon"
          ><mwc-icon slot="graphic">lock</mwc-icon>Secrets Editor</mwc-list-item
        >
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

  private _handleSearch() {
    toggleSearch();
  }

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
        this._handleSearch();
        break;
      case 1:
        this._handleUpdateAll();
        break;
      case 2:
        this._handleEditSecrets();
        break;
    }
  }

  static styles = css`
    esphome-button-menu {
      z-index: 1;
    }
    mwc-button {
      --mdc-theme-primary: var(--primary-text-color);
      margin-left: 16px;
      line-height: 1em;
    }
    mwc-button.search {
      margin: 0;
      padding: 0;
      width: 30px;
    }
    mwc-icon {
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
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
