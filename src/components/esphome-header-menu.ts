import { css, html, LitElement, nothing, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./esphome-button-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import "@material/mwc-button";
import "@material/mwc-icon";
import "@material/mwc-select";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import type { Select } from "@material/mwc-select";
import { openEditDialog, toggleSearch } from "../editor";
import { SECRETS_FILE } from "../api/secrets";
import { openUpdateAllDialog } from "../update-all";
import { showConfirmationDialog } from "../dialogs";
import { fireEvent } from "../util/fire-event";
import { mdiViewGrid, mdiViewList } from "@mdi/js";
import "./esphome-svg-icon";

const isWideListener = window.matchMedia("(min-width: 641px)");

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  @property({ type: String, attribute: "logout-url" }) logoutUrl?: string;

  @property() showDiscoveredDevices = false;

  @property() discoveredDeviceCount = 0;

  @state() private _isWide = isWideListener.matches;
  @state() private _viewMode: 'cards' | 'table' = 'cards';
  @state() private _sortBy: 'name' | 'ip' | 'status' = 'name';
  @state() private _filterStatus: 'all' | 'online' | 'offline' = 'all';

  protected render(): TemplateResult {
    return html`
      ${this._isWide
        ? html`
            <div class="view-controls">
              <mwc-icon-button
                @click=${this._toggleViewMode}
                .title=${this._viewMode === 'cards' ? 'Switch to table view' : 'Switch to card view'}
              >
                <esphome-svg-icon
                  .path=${this._viewMode === 'cards' ? mdiViewList : mdiViewGrid}
                ></esphome-svg-icon>
              </mwc-icon-button>
              
              <mwc-select
                .value=${this._sortBy}
                @change=${this._handleSortChange}
                label="Sort by"
                outlined
              >
                <mwc-list-item value="name">Name</mwc-list-item>
                <mwc-list-item value="ip">IP Address</mwc-list-item>
                <mwc-list-item value="status">Status</mwc-list-item>
              </mwc-select>
              
              <mwc-select
                .value=${this._filterStatus}
                @change=${this._handleFilterChange}
                label="Filter"
                outlined
              >
                <mwc-list-item value="all">All devices</mwc-list-item>
                <mwc-list-item value="online">Online only</mwc-list-item>
                <mwc-list-item value="offline">Offline only</mwc-list-item>
              </mwc-select>
            </div>
            
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

  private _handleEditSecrets() {
    openEditDialog(SECRETS_FILE);
  }

  private _toggleViewMode() {
    this._viewMode = this._viewMode === 'cards' ? 'table' : 'cards';
    fireEvent(document, 'view-mode-changed', { viewMode: this._viewMode });
  }

  private _handleSortChange(ev: Event) {
    const select = ev.target as Select;
    this._sortBy = select.value as 'name' | 'ip' | 'status';
    fireEvent(document, 'sort-changed', { sortBy: this._sortBy });
  }

  private _handleFilterChange(ev: Event) {
    const select = ev.target as Select;
    this._filterStatus = select.value as 'all' | 'online' | 'offline';
    fireEvent(document, 'filter-changed', { filterStatus: this._filterStatus });
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
    a {
      text-decoration: none;
    }
    .view-controls {
      display: flex;
      align-items: center;
      margin-right: 16px;
      gap: 8px;
    }
    mwc-select {
      --mdc-theme-primary: var(--primary-color);
      --mdc-theme-surface: var(--primary-background-color);
      --mdc-select-ink-color: var(--primary-text-color);
      --mdc-select-label-ink-color: var(--secondary-text-color);
      --mdc-select-dropdown-icon-color: var(--secondary-text-color);
      --mdc-select-idle-line-color: var(--secondary-text-color);
      --mdc-select-hover-line-color: var(--primary-color);
      --mdc-select-outlined-idle-border-color: var(--secondary-text-color);
      --mdc-select-outlined-hover-border-color: var(--primary-color);
      width: 140px;
    }
    mwc-icon-button {
      --mdc-icon-button-size: 40px;
      --mdc-icon-size: 24px;
    }
    @media only screen and (max-width: 640px) {
      .view-controls {
        display: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-header-menu": ESPHomeHeaderMenu;
  }
}
