import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./esphome-button-menu";
import "./esphome-language-selector";
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
import { t } from "../locales";

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
              label="${t("header.updateAll")}"
              @click=${this._handleUpdateAll}
            ></mwc-button>
            <mwc-button
              label="${t("header.cleanAll")}"
              @click=${this._handleCleanAll}
            >
              <esphome-svg-icon
                slot="icon"
                .path=${mdiBroom}
              ></esphome-svg-icon>
            </mwc-button>
            <mwc-button
              icon="lock"
              label="${t("header.secrets")}"
              @click=${this._handleEditSecrets}
            ></mwc-button>
          `
        : nothing}
      <mwc-button class="search" @click=${this._handleSearch}>
        <mwc-icon>search</mwc-icon>
      </mwc-button>

      <esphome-language-selector></esphome-language-selector>

      <esphome-button-menu
        corner="BOTTOM_START"
        @action=${this._handleOverflowAction}
      >
        <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
        ${!this._isWide
          ? html`
              <mwc-list-item graphic="icon"
                ><mwc-icon slot="graphic">search</mwc-icon>${t(
                  "header.search",
                )}</mwc-list-item
              >
            `
          : nothing}

        <mwc-list-item graphic="icon"
          ><mwc-icon slot="graphic">filter_list</mwc-icon>
          ${this.showDiscoveredDevices
            ? t("header.hideDiscoveredDevices")
            : t("header.showDiscoveredDevices")}
        </mwc-list-item>

        ${!this._isWide
          ? html`
              <mwc-list-item graphic="icon"
                ><mwc-icon slot="graphic">system_update</mwc-icon>${t(
                  "header.updateAll",
                )}</mwc-list-item
              >
              <mwc-list-item graphic="icon"
                ><esphome-svg-icon
                  slot="graphic"
                  .path=${mdiBroom}
                ></esphome-svg-icon
                >${t("header.cleanAll")}</mwc-list-item
              >
              <mwc-list-item graphic="icon"
                ><mwc-icon slot="graphic">lock</mwc-icon>${t(
                  "header.secretsEditor",
                )}</mwc-list-item
              >
            `
          : nothing}
        ${this.logoutUrl
          ? html`
              <a href=${this.logoutUrl}
                ><mwc-list-item>${t("header.logOut")}</mwc-list-item></a
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
        title: t("header.updateAll"),
        text: t("header.updateAllConfirm"),
        confirmText: t("header.updateAll"),
        dismissText: t("cancel"),
      }))
    ) {
      return;
    }
    openUpdateAllDialog();
  }

  private async _handleCleanAll() {
    if (
      !(await showConfirmationDialog({
        title: t("header.cleanAll"),
        text: t("header.cleanAllConfirm"),
        confirmText: t("header.cleanAll"),
        dismissText: t("cancel"),
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
