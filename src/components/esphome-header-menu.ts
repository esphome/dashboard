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
const isDarkListener = window.matchMedia("(prefers-color-scheme: dark)");

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  @property({ type: String, attribute: "logout-url" }) logoutUrl?: string;

  @state() private _isWide = isWideListener.matches;
  @state() private _themeMode = isDarkListener.matches ? "dark" : "light";

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

      const themeModeIcon =
        this._themeMode === "light"
          ? html`<svg
              xmlns="http://www.w3.org/2000/svg"
              enable-background="new 0 0 24 24"
              height="24px"
              viewBox="0 0 24 24"
              width="24px"
              fill="currentColor"
            >
              <rect fill="none" height="24" width="24" />
              <path
                d="M9.37,5.51C9.19,6.15,9.1,6.82,9.1,7.5c0,4.08,3.32,7.4,7.4,7.4c0.68,0,1.35-0.09,1.99-0.27C17.45,17.19,14.93,19,12,19 c-3.86,0-7-3.14-7-7C5,9.07,6.81,6.55,9.37,5.51z M12,3c-4.97,0-9,4.03-9,9s4.03,9,9,9s9-4.03,9-9c0-0.46-0.04-0.92-0.1-1.36 c-0.98,1.37-2.58,2.26-4.4,2.26c-2.98,0-5.4-2.42-5.4-5.4c0-1.81,0.89-3.42,2.26-4.4C12.92,3.04,12.46,3,12,3L12,3z"
              />
            </svg>`
          : html`<svg
              xmlns="http://www.w3.org/2000/svg"
              enable-background="new 0 0 24 24"
              height="24px"
              viewBox="0 0 24 24"
              width="24px"
              fill="currentColor"
            >
              <rect fill="none" height="24" width="24" />
              <path
                d="M12,9c1.65,0,3,1.35,3,3s-1.35,3-3,3s-3-1.35-3-3S10.35,9,12,9 M12,7c-2.76,0-5,2.24-5,5s2.24,5,5,5s5-2.24,5-5 S14.76,7,12,7L12,7z M2,13l2,0c0.55,0,1-0.45,1-1s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S1.45,13,2,13z M20,13l2,0c0.55,0,1-0.45,1-1 s-0.45-1-1-1l-2,0c-0.55,0-1,0.45-1,1S19.45,13,20,13z M11,2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V2c0-0.55-0.45-1-1-1S11,1.45,11,2z M11,20v2c0,0.55,0.45,1,1,1s1-0.45,1-1v-2c0-0.55-0.45-1-1-1C11.45,19,11,19.45,11,20z M5.99,4.58c-0.39-0.39-1.03-0.39-1.41,0 c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0s0.39-1.03,0-1.41L5.99,4.58z M18.36,16.95 c-0.39-0.39-1.03-0.39-1.41,0c-0.39,0.39-0.39,1.03,0,1.41l1.06,1.06c0.39,0.39,1.03,0.39,1.41,0c0.39-0.39,0.39-1.03,0-1.41 L18.36,16.95z M19.42,5.99c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06c-0.39,0.39-0.39,1.03,0,1.41 s1.03,0.39,1.41,0L19.42,5.99z M7.05,18.36c0.39-0.39,0.39-1.03,0-1.41c-0.39-0.39-1.03-0.39-1.41,0l-1.06,1.06 c-0.39,0.39-0.39,1.03,0,1.41s1.03,0.39,1.41,0L7.05,18.36z"
              />
            </svg>`;

      const customIconButton = (
        icon: string | TemplateResult<1>,
        label: string,
        clickHandler: () => void
      ): TemplateResult => {
        if (typeof icon !== "string") {
          return html`
            <div class="tooltip-container">
              <mwc-icon-button @click=${clickHandler} class=${label.toLowerCase().replace(" ", "-") + " custom-icon"}>
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

      const themeModeButton = (): TemplateResult => {
        if (this._themeMode === "dark") {
          return customIconButton(themeModeIcon, "Light Mode", () => {
            this._themeMode = "light";
            this._setThemeModeUpdated({});
          });
        }
        return customIconButton(themeModeIcon, "Dark Mode", () => {
          this._themeMode = "dark";
          this._setThemeModeUpdated({});
        });
      };

      return html`
        <div class="esphome-header-menu">
          ${customIconButton("system_update", "Update All", this._handleUpdateAll)}
          ${customIconButton("lock_outlined", "Secrets", this._handleEditSecrets)}
          ${customIconButton("search", "Search", this._handleSearch)}
          ${this.logoutUrl
            ? html` <a href=${this.logoutUrl}> ${customIconButton(logoutIcon, "Log Out", () => {})} </a> `
            : ""}
          ${themeModeButton()}
        </div>
      `;
    }

    return html`
      <div class="esphome-header-menu">
        <esphome-button-menu corner="BOTTOM_START" @action=${this._handleOverflowAction}>
          <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
          <mwc-list-item graphic="icon"><mwc-icon slot="graphic">search</mwc-icon>Search</mwc-list-item>
          <mwc-list-item graphic="icon"><mwc-icon slot="graphic">system_update</mwc-icon>Update All</mwc-list-item>
          <mwc-list-item graphic="icon"><mwc-icon slot="graphic">lock_outlined</mwc-icon>Secrets Editor</mwc-list-item>
          ${this.logoutUrl ? html` <a href=${this.logoutUrl}><mwc-list-item>Log Out</mwc-list-item></a> ` : ""}
          <slot></slot>
        </esphome-button-menu>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    isWideListener.addEventListener("change", this._isWideUpdated);
    this._themeMode = isDarkListener.matches ? "dark" : "light";
    this._setThemeModeUpdated({
      isMount: true,
    });
    isDarkListener.addEventListener("change", () => {
      this._themeMode = isDarkListener.matches ? "dark" : "light";
      this._setThemeModeUpdated({});
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    isWideListener.removeEventListener("change", this._isWideUpdated);
    isDarkListener.removeEventListener("change", () => {
      this._themeMode = isDarkListener.matches ? "dark" : "light";
      this._setThemeModeUpdated({});
    });
  }

  private _setThemeModeUpdated({ isMount = false }: { isMount?: boolean }) {
    document.body.style.transition = `background-color ${isMount ? "0s" : "0.4s"} ease-in-out`;
    setTimeout(() => {
      document.body.style.transition = "";
    }, 200);
    if (this._themeMode === "dark") {
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.removeAttribute("data-theme");
    }
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
