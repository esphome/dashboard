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
import { openUpdateOnlineDialog } from "../update-online";
import { openCleanAllDialog } from "../clean-all";
import { showConfirmationDialog } from "../dialogs";
import { fireEvent } from "../util/fire-event";
import { mdiBroom } from "@mdi/js";
import "../components/esphome-svg-icon";
import { getDevices, canUpdateDevice } from "../api/devices";
import { getOnlineStatus } from "../api/online-status";

const isWideListener = window.matchMedia("(min-width: 641px)");

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  @property({ type: String, attribute: "logout-url" }) logoutUrl?: string;

  @property() showDiscoveredDevices = false;

  @property() discoveredDeviceCount = 0;

  @state() private _isWide = isWideListener.matches;
  @state() private _isLoadingUpdateOnline = false;

  protected render(): TemplateResult {
    return html`
      ${this._isWide
        ? html`
            <mwc-button
              icon="system_update"
              label="Update All"
              @click=${this._handleUpdateAll}
            ></mwc-button>
            <mwc-button
              icon="wifi"
              .label=${this._isLoadingUpdateOnline ? "Checking..." : "Update Online"}
              ?disabled=${this._isLoadingUpdateOnline}
              @click=${this._handleUpdateOnline}
            ></mwc-button>
            <mwc-button label="Clean All Files" @click=${this._handleCleanAll}>
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
              <mwc-list-item graphic="icon" data-action="search"
                ><mwc-icon slot="graphic">search</mwc-icon>Search</mwc-list-item
              >
            `
          : nothing}

        <mwc-list-item graphic="icon" data-action="toggle-discovered"
          ><mwc-icon slot="graphic">filter_list</mwc-icon>
          ${this.showDiscoveredDevices
            ? "Hide discovered devices"
            : "Show discovered devices"}
        </mwc-list-item>

        ${!this._isWide
          ? html`
              <mwc-list-item graphic="icon" data-action="update-all"
                ><mwc-icon slot="graphic">system_update</mwc-icon>Update
                All</mwc-list-item
              >
              <mwc-list-item
                graphic="icon"
                data-action="update-online"
                ?disabled=${this._isLoadingUpdateOnline}
                ><mwc-icon slot="graphic">wifi</mwc-icon>${this._isLoadingUpdateOnline ? "Checking..." : "Update Online"}</mwc-list-item
              >
              <mwc-list-item graphic="icon" data-action="clean-all"
                ><esphome-svg-icon
                  slot="graphic"
                  .path=${mdiBroom}
                ></esphome-svg-icon
                >Clean All Files</mwc-list-item
              >
              <mwc-list-item graphic="icon" data-action="secrets"
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

  private _handleCleanAll() {
    openCleanAllDialog();
  }

  private async _handleUpdateOnline() {
    if (this._isLoadingUpdateOnline) return;

    this._isLoadingUpdateOnline = true;
    let devices;
    let onlineStatus;
    try {
      [devices, onlineStatus] = await Promise.all([
        getDevices(),
        getOnlineStatus(),
      ]);
    } catch (error) {
      this._isLoadingUpdateOnline = false;
      alert("Failed to fetch device status. Please try again.");
      return;
    }
    this._isLoadingUpdateOnline = false;

    // Filter to devices that are BOTH online AND have an update available
    const updatableOnlineDevices = devices.configured.filter(
      (d) => onlineStatus[d.configuration] === true && canUpdateDevice(d),
    );
    const updatableConfigs = updatableOnlineDevices.map((d) => d.configuration);

    // Count devices in different states for the message
    const totalConfigured = devices.configured.length;
    const onlineCount = devices.configured.filter(
      (d) => onlineStatus[d.configuration] === true,
    ).length;
    const onlineButCurrentCount = onlineCount - updatableConfigs.length;
    const offlineCount = totalConfigured - onlineCount;

    if (updatableConfigs.length === 0) {
      const reasons: string[] = [];
      if (onlineButCurrentCount > 0) {
        reasons.push(`${onlineButCurrentCount} online but already up-to-date`);
      }
      if (offlineCount > 0) {
        reasons.push(`${offlineCount} offline/unknown`);
      }
      alert(
        `No devices need updating.\n\n${reasons.join("\n") || "All devices are current."}`,
      );
      return;
    }

    const skippedParts: string[] = [];
    if (onlineButCurrentCount > 0) {
      skippedParts.push(`${onlineButCurrentCount} already current`);
    }
    if (offlineCount > 0) {
      skippedParts.push(`${offlineCount} offline`);
    }
    const skippedText =
      skippedParts.length > 0 ? ` (skipping: ${skippedParts.join(", ")})` : "";

    if (
      !(await showConfirmationDialog({
        title: "Update Online Devices",
        text: `Update ${updatableConfigs.length} device${updatableConfigs.length === 1 ? "" : "s"}?${skippedText}`,
        confirmText: "Update",
        dismissText: "Cancel",
      }))
    ) {
      return;
    }

    openUpdateOnlineDialog(updatableConfigs);
  }

  private _handleEditSecrets() {
    openEditDialog(SECRETS_FILE);
  }

  private async _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    const menu = ev.currentTarget as HTMLElement;
    const listItems = menu.querySelectorAll("mwc-list-item[data-action]");
    const clickedItem = listItems[ev.detail.index] as HTMLElement | undefined;
    const action = clickedItem?.dataset.action;

    switch (action) {
      case "search":
        this._handleSearch();
        break;
      case "toggle-discovered":
        fireEvent(this, "toggle-discovered-devices");
        break;
      case "update-all":
        this._handleUpdateAll();
        break;
      case "update-online":
        this._handleUpdateOnline();
        break;
      case "clean-all":
        this._handleCleanAll();
        break;
      case "secrets":
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
