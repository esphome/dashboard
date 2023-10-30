import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./esphome-button-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import "@material/mwc-button";
import "@material/mwc-icon";
import "@polymer/paper-tooltip/paper-tooltip.js";
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
      const logoutIcon = this.logoutUrl
        ? html`<svg
            xmlns="http://www.w3.org/2000/svg"
            enable-background="new 0 0 24 24"
            height="24px"
            viewBox="0 0 24 24"
            width="24px"
            fill="currentColor"
          >
            <g><path d="M0,0h24v24H0V0z" fill="none" /></g>
            <g>
              <path
                d="M17,8l-1.41,1.41L17.17,11H9v2h8.17l-1.58,1.58L17,16l4-4L17,8z M5,5h7V3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h7v-2H5V5z"
              />
            </g>
          </svg>`
        : html``;

      const customIconButton = (
        icon: string | TemplateResult<1>,
        label: string,
        clickHandler: () => void
      ): TemplateResult => {
        if (typeof icon !== "string") {
          return html`
            <div class="tooltip-container">
              <mwc-icon-button
                @click=${clickHandler}
                class=${label.toLowerCase().replace(" ", "-") + " custom-icon"}
              >
                ${icon}
              </mwc-icon-button>
              <paper-tooltip> ${label} </paper-tooltip>
            </div>
          `;
        }
        return html`
          <div class="tooltip-container">
            <mwc-icon-button
              @click=${clickHandler}
              class=${label.toLowerCase().replace(" ", "-")}
              icon=${icon}
              label=${label}
            ></mwc-icon-button>
            <paper-tooltip> ${label} </paper-tooltip>
          </div>
        `;
      };

      return html`
        <div class="esphome-header-menu">
          ${customIconButton(
            "system_update",
            "Update All",
            this._handleUpdateAll
          )}
          ${customIconButton(
            "lock_outlined",
            "Secrets",
            this._handleEditSecrets
          )}
          ${customIconButton("search", "Search", this._handleSearch)}
          ${this.logoutUrl
            ? html`
                <a href=${this.logoutUrl}>
                  ${customIconButton(logoutIcon, "Log Out", () => {})}
                </a>
              `
            : ""}
        </div>
      `;
    }

    return html`
      <div class="esphome-header-menu">
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
            ><mwc-icon slot="graphic">lock_outlined</mwc-icon>Secrets
            Editor</mwc-list-item
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
      </div>
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
    .esphome-header-menu {
      display: flex;
      align-items: center;
      flex-direction: row;
      gap: 8px;
    }

    esphome-button-menu {
      z-index: 1;
    }
    mwc-button {
      --mdc-theme-primary: var(--primary-text-color);
      margin-left: 16px;
      line-height: 1em;
    }
    mwc-icon {
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
    }
    a {
      text-decoration: none;
    }

    .custom-icon {
      color: var(--primary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-header-menu": ESPHomeHeaderMenu;
  }
}
