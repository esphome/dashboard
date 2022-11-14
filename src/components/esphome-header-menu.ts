import { css, html, LitElement, TemplateResult } from "lit";
import { property, state, customElement } from "lit/decorators.js";
import "./esphome-button-menu";
import "./esphome-icon-button";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import "@material/mwc-button";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import { openEditDialog } from "../editor";
import { SECRETS_FILE } from "../api/secrets";
import { openUpdateAllDialog } from "../update-all";
import { showConfirmationDialog } from "../dialogs";
import { mdiCellphoneArrowDown, mdiLock, mdiMagnify } from "@mdi/js";
import { fireEvent } from "../util/fire-event";

const isWideListener = window.matchMedia("(min-width: 601px)");

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  @property({ type: String, attribute: "logout-url" }) logoutUrl?: string;

  @state() private _isWide = isWideListener.matches;

  protected render(): TemplateResult {
    if (this._isWide) {
      return html`
        <esphome-icon-button
          .path=${mdiMagnify}
          .label=${"Toggle Search"}
          @click=${() => fireEvent(this, "toggle-search")}
        ></esphome-icon-button>

        <esphome-icon-button
          .path=${mdiCellphoneArrowDown}
          .label=${"Update All"}
          @click=${this._handleUpdateAll}
        ></esphome-icon-button>

        <esphome-icon-button
          .path=${mdiLock}
          .label=${"Secrets Editor"}
          @click=${this._handleEditSecrets}
        ></esphome-icon-button>

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

        <mwc-list-item graphic="icon"
          >Toggle Search<esphome-svg-icon
            slot="graphic"
            .path=${mdiMagnify}
          ></esphome-svg-icon
        ></mwc-list-item>

        <mwc-list-item graphic="icon"
          >Update All<esphome-svg-icon
            slot="graphic"
            .path=${mdiCellphoneArrowDown}
          ></esphome-svg-icon
        ></mwc-list-item>
        <mwc-list-item graphic="icon"
          >Secrets Editor<esphome-svg-icon
            slot="graphic"
            .path=${mdiLock}
          ></esphome-svg-icon
        ></mwc-list-item>
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
        fireEvent(this, "toggle-search");
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
      --mdc-theme-primary: black;
      margin-left: 16px;
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
