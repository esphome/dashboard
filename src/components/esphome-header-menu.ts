import { css, html, LitElement, nothing, TemplateResult } from "lit";
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
import { openCleanAllDialog } from "../clean-all";
import { showConfirmationDialog } from "../dialogs";
import { fireEvent } from "../util/fire-event";
import { mdiBroom } from "@mdi/js";
import "../components/esphome-svg-icon";

const isWideListener = window.matchMedia("(min-width: 641px)");

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  @property({ type: String, attribute: "logout-url" }) logoutUrl?: string;

  @property() showDiscoveredDevices = false;

  @property() discoveredDeviceCount = 0;

  @state() private _isWide = isWideListener.matches;

  protected render(): TemplateResult {
    return html`
      ${this._isWide
        ? html`
            <mwc-button
              icon="system_update"
              label="Update All"
              @click=${this._handleUpdateAll}
            ></mwc-button>
            <mwc-button label="Clean All" @click=${this._handleCleanAll}>
              <esphome-svg-icon
                slot="icon"
                .path=${mdiBroom}
              ></esphome-svg-icon>
            </mwc-button>
            <mwc-button
              icon="lock"
              label="Secrets"
              @click=${this._handleEditSecrets}
            ></mwc-button>
          `
        : nothing}
      <mwc-button class="search" @click=${this._handleSearch}>
        <mwc-icon>search</mwc-icon>
      </mwc-button>

      <esphome-button-menu
        corner="BOTTOM_START"
        @action=${this._handleOverflowAction}
      >
        <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
        ${!this._isWide
          ? html`
              <mwc-list-item graphic="icon"
                ><mwc-icon slot="graphic">search</mwc-icon>Search</mwc-list-item
              >
            `
          : nothing}

        <mwc-list-item graphic="icon"
          ><mwc-icon slot="graphic">filter_list</mwc-icon>
          ${this.showDiscoveredDevices
            ? "Hide discovered devices"
            : "Show discovered devices"}
        </mwc-list-item>

        ${!this._isWide
          ? html`
              <mwc-list-item graphic="icon"
                ><mwc-icon slot="graphic">system_update</mwc-icon>Update
                All</mwc-list-item
              >
              <mwc-list-item graphic="icon"
                ><esphome-svg-icon
                  slot="graphic"
                  .path=${mdiBroom}
                ></esphome-svg-icon
                >Clean All</mwc-list-item
              >
              <mwc-list-item graphic="icon"
                ><mwc-icon slot="graphic">lock</mwc-icon>Secrets
                Editor</mwc-list-item
              >
            `
          : nothing}
        ${this.logoutUrl
          ? html`
              <a href=${this.logoutUrl}
                ><mwc-list-item>Log Out</mwc-list-item></a
              >
            `
          : ""}
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

  private async _handleCleanAll() {
    if (
      !(await showConfirmationDialog({
        title: "Clean All",
        text:
          "Do you want to clean all build and platform files? " +
          "This will remove all cached files and dependencies, " +
          "which may take a while to re-download and reinstall.",
        confirmText: "Clean All",
        dismissText: "Cancel",
        destructive: true,
      }))
    ) {
      return;
    }
    openCleanAllDialog();
  }

  private _handleEditSecrets() {
    openEditDialog(SECRETS_FILE);
  }

  private async _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    if (this._isWide) {
      switch (ev.detail.index) {
        case 0:
          fireEvent(this, "toggle-discovered-devices");
          break;
      }
      return;
    }
    switch (ev.detail.index) {
      case 0:
        this._handleSearch();
        break;
      case 1:
        fireEvent(this, "toggle-discovered-devices");
        break;
      case 2:
        this._handleUpdateAll();
        break;
      case 3:
        this._handleCleanAll();
        break;
      case 4:
        this._handleEditSecrets();
        break;
    }
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      --mdc-theme-primary: var(--primary-text-color);
    }
    .search {
      width: 48px;
    }
    esphome-button-menu {
      z-index: 1;
    }
    mwc-icon {
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
    }
    esphome-svg-icon {
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
      color: var(--primary-text-color);
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
