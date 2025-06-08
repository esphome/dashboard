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
  @state() private _viewMode: "cards" | "table" = this._loadPreference(
    "viewMode",
    "cards",
  ) as "cards" | "table";
  @state() private _sortBy: "name" | "ip" | "status" = this._loadPreference(
    "sortBy",
    "name",
  ) as "name" | "ip" | "status";
  @state() private _filterStatus: "all" | "online" | "offline" =
    this._loadPreference("filterStatus", "all") as "all" | "online" | "offline";
  @state() private _cardColumns: number = parseInt(
    this._loadPreference("cardColumns", "3"),
    10,
  );

  protected render(): TemplateResult {
    return html`
      ${this._isWide
        ? html`
            <div class="view-controls">
              <mwc-icon-button
                @click=${this._toggleViewMode}
                .title=${this._viewMode === "cards"
                  ? "Switch to table view"
                  : "Switch to card view"}
              >
                <esphome-svg-icon
                  .path=${this._viewMode === "cards"
                    ? mdiViewList
                    : mdiViewGrid}
                ></esphome-svg-icon>
              </mwc-icon-button>

              ${this._viewMode === "cards"
                ? html`
                    <mwc-select
                      .value=${String(this._cardColumns)}
                      @change=${this._handleColumnsChange}
                      label="Columns"
                    >
                      <mwc-list-item value="1">1 Column</mwc-list-item>
                      <mwc-list-item value="2">2 Columns</mwc-list-item>
                      <mwc-list-item value="3">3 Columns</mwc-list-item>
                      <mwc-list-item value="4">4 Columns</mwc-list-item>
                      <mwc-list-item value="5">5 Columns</mwc-list-item>
                    </mwc-select>
                  `
                : nothing}

              <mwc-select
                .value=${this._sortBy}
                @change=${this._handleSortChange}
                label="Sort by"
              >
                <mwc-list-item value="name">Name</mwc-list-item>
                <mwc-list-item value="ip">IP Address</mwc-list-item>
                <mwc-list-item value="status">Status</mwc-list-item>
              </mwc-select>

              <mwc-select
                .value=${this._filterStatus}
                @change=${this._handleFilterChange}
                label="Filter"
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
              <mwc-list-item graphic="icon">
                <mwc-icon slot="graphic"
                  >${this._viewMode === "cards"
                    ? "view_list"
                    : "view_module"}</mwc-icon
                >
                ${this._viewMode === "cards" ? "Table View" : "Card View"}
              </mwc-list-item>
              ${this._viewMode === "cards"
                ? html`
                    <li divider role="separator"></li>
                    <mwc-list-item graphic="icon">
                      <mwc-icon slot="graphic">view_column</mwc-icon>
                      1 Column
                    </mwc-list-item>
                    <mwc-list-item graphic="icon">
                      <mwc-icon slot="graphic">view_column</mwc-icon>
                      2 Columns
                    </mwc-list-item>
                    <mwc-list-item graphic="icon">
                      <mwc-icon slot="graphic">view_column</mwc-icon>
                      3 Columns
                    </mwc-list-item>
                    <mwc-list-item graphic="icon">
                      <mwc-icon slot="graphic">view_column</mwc-icon>
                      4 Columns
                    </mwc-list-item>
                    <mwc-list-item graphic="icon">
                      <mwc-icon slot="graphic">view_column</mwc-icon>
                      5 Columns
                    </mwc-list-item>
                  `
                : nothing}
              <li divider role="separator"></li>
              <mwc-list-item graphic="icon">
                <mwc-icon slot="graphic">sort</mwc-icon>
                Sort by Name
              </mwc-list-item>
              <mwc-list-item graphic="icon">
                <mwc-icon slot="graphic">sort</mwc-icon>
                Sort by IP
              </mwc-list-item>
              <mwc-list-item graphic="icon">
                <mwc-icon slot="graphic">sort</mwc-icon>
                Sort by Status
              </mwc-list-item>
              <li divider role="separator"></li>
              <mwc-list-item graphic="icon">
                <mwc-icon slot="graphic">filter_list</mwc-icon>
                Show All
              </mwc-list-item>
              <mwc-list-item graphic="icon">
                <mwc-icon slot="graphic">filter_list</mwc-icon>
                Online Only
              </mwc-list-item>
              <mwc-list-item graphic="icon">
                <mwc-icon slot="graphic">filter_list</mwc-icon>
                Offline Only
              </mwc-list-item>
              <li divider role="separator"></li>
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

    // Emit initial state so devices list gets the saved preferences
    setTimeout(() => {
      fireEvent(document, "view-mode-changed", { viewMode: this._viewMode });
      fireEvent(document, "sort-changed", { sortBy: this._sortBy });
      fireEvent(document, "filter-changed", {
        filterStatus: this._filterStatus,
      });
      fireEvent(document, "columns-changed", { columns: this._cardColumns });
    }, 0);
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
    this._viewMode = this._viewMode === "cards" ? "table" : "cards";
    this._savePreference("viewMode", this._viewMode);
    fireEvent(document, "view-mode-changed", { viewMode: this._viewMode });
  }

  private _handleSortChange(ev: Event) {
    const select = ev.target as Select;
    this._sortBy = select.value as "name" | "ip" | "status";
    this._savePreference("sortBy", this._sortBy);
    fireEvent(document, "sort-changed", { sortBy: this._sortBy });
  }

  private _handleFilterChange(ev: Event) {
    const select = ev.target as Select;
    this._filterStatus = select.value as "all" | "online" | "offline";
    this._savePreference("filterStatus", this._filterStatus);
    fireEvent(document, "filter-changed", { filterStatus: this._filterStatus });
  }

  private _handleColumnsChange(ev: Event) {
    const select = ev.target as Select;
    this._cardColumns = parseInt(select.value, 10);
    this._savePreference("cardColumns", String(this._cardColumns));
    fireEvent(document, "columns-changed", { columns: this._cardColumns });
  }

  private _loadPreference(key: string, defaultValue: string): string {
    try {
      return localStorage.getItem(`esphome.devices.${key}`) || defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private _savePreference(key: string, value: string): void {
    try {
      localStorage.setItem(`esphome.devices.${key}`, value);
    } catch {
      // Ignore localStorage errors
    }
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

    // Mobile menu structure:
    // 0: Search
    // 1: View toggle
    // If cards mode, add column options:
    // 2-6: Column options (1-5 columns)
    // Then continues with sort and filter options

    let index = ev.detail.index;

    switch (index) {
      case 0:
        this._handleSearch();
        break;
      case 1:
        this._toggleViewMode();
        break;
      default:
        // Adjust index based on whether we're in cards mode
        if (this._viewMode === "cards") {
          if (index >= 2 && index <= 6) {
            // Column selection (1-5 columns)
            this._cardColumns = index - 1;
            this._savePreference("cardColumns", String(this._cardColumns));
            fireEvent(document, "columns-changed", {
              columns: this._cardColumns,
            });
            return;
          }
          // Adjust index for items after column selection
          index = index - 5;
        }

        // Continue with adjusted index
        switch (index) {
          case 2:
            this._sortBy = "name";
            this._savePreference("sortBy", this._sortBy);
            fireEvent(document, "sort-changed", { sortBy: this._sortBy });
            break;
          case 3:
            this._sortBy = "ip";
            this._savePreference("sortBy", this._sortBy);
            fireEvent(document, "sort-changed", { sortBy: this._sortBy });
            break;
          case 4:
            this._sortBy = "status";
            this._savePreference("sortBy", this._sortBy);
            fireEvent(document, "sort-changed", { sortBy: this._sortBy });
            break;
          case 5:
            this._filterStatus = "all";
            this._savePreference("filterStatus", this._filterStatus);
            fireEvent(document, "filter-changed", {
              filterStatus: this._filterStatus,
            });
            break;
          case 6:
            this._filterStatus = "online";
            this._savePreference("filterStatus", this._filterStatus);
            fireEvent(document, "filter-changed", {
              filterStatus: this._filterStatus,
            });
            break;
          case 7:
            this._filterStatus = "offline";
            this._savePreference("filterStatus", this._filterStatus);
            fireEvent(document, "filter-changed", {
              filterStatus: this._filterStatus,
            });
            break;
          case 8:
            fireEvent(this, "toggle-discovered-devices");
            break;
          case 9:
            this._handleUpdateAll();
            break;
          case 10:
            this._handleEditSecrets();
            break;
        }
    }
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      --mdc-theme-primary: var(--primary-text-color);
      position: relative;
      z-index: 100;
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
      --mdc-theme-primary: var(--primary-text-color);
      --mdc-theme-surface: var(--card-background-color);
      --mdc-select-ink-color: var(--primary-text-color);
      --mdc-select-label-ink-color: var(--primary-text-color);
      --mdc-select-dropdown-icon-color: var(--primary-text-color);
      --mdc-select-idle-line-color: transparent;
      --mdc-select-hover-line-color: transparent;
      --mdc-select-outlined-idle-border-color: transparent;
      --mdc-select-outlined-hover-border-color: transparent;
      --mdc-select-focused-line-color: transparent;
      --mdc-select-outlined-focused-border-color: transparent;
      --mdc-list-item-text-color: var(--primary-text-color);
      --mdc-list-item-selected-color: var(--primary-text-color);
      --mdc-list-item-activated-color: var(--primary-text-color);
      --mdc-list-item-meta-ink-color: var(--primary-text-color);
      --mdc-list-vertical-padding: 8px;
      --mdc-menu-item-height: 48px;
      --mdc-list-side-padding: 16px;
      --mdc-menu-surface-color: var(--card-background-color);
      --mdc-ripple-color: rgba(255, 255, 255, 0.1);
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
      --mdc-theme-text-secondary-on-background: var(--secondary-text-color);
      --mdc-select-fill-color: transparent;
      --mdc-menu-max-height: 400px;
      background: transparent;
      width: 140px;
      position: relative;
      z-index: 200;
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
