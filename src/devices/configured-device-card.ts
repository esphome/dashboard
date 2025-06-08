import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { ConfiguredDevice } from "../api/devices";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-button";
import "@material/mwc-icon-button";
import "../components/esphome-button-menu";
import "../components/esphome-card";
import "../components/esphome-svg-icon";
import "@polymer/paper-tooltip/paper-tooltip.js";
import { openCleanMQTTDialog } from "../clean-mqtt";
import { openCleanDialog } from "../clean";
import { openValidateDialog } from "../validate";
import { openInstallChooseDialog } from "../install-choose";
import { openLogsTargetDialog } from "../logs-target";
import { fireEvent } from "../util/fire-event";
import { openDeleteDeviceDialog } from "../delete-device";
import { esphomeCardStyles } from "../styles";
import { openRenameDialog } from "../rename";
import { openShowApiKeyDialog } from "../show-api-key";
import { openEditDialog } from "../editor";
import { getFile } from "../api/files";
import { textDownload } from "../util/file-download";
import {
  mdiBroom,
  mdiCodeBraces,
  mdiDelete,
  mdiDownload,
  mdiKey,
  mdiRenameBox,
  mdiSpellcheck,
  mdiUploadNetwork,
} from "@mdi/js";
import { DownloadType, getDownloadUrl } from "../api/download";

const STATUS_COLORS = {
  NEW: "var(--status-new)",
  OFFLINE: "var(--alert-error-color)",
  ONLINE: "var(--status-connected)",
};

@customElement("esphome-configured-device-card")
class ESPHomeConfiguredDeviceCard extends LitElement {
  @property() public device!: ConfiguredDevice;
  @property() public onlineStatus?: boolean;
  @property() public deviceIP?: string | null;
  @property() public highlightOnAdd = false;
  @state() private _highlight = false;

  public async highlight() {
    this._highlight = true;
    await this.updateComplete;
    await this.shadowRoot!.querySelector("esphome-card")!.getAttention();
    await new Promise((resolve) => setTimeout(resolve, 4000));
    this._highlight = false;
  }

  protected render() {
    const status = this._highlight
      ? "NEW"
      : this.onlineStatus
        ? "ONLINE"
        : "OFFLINE";

    return html`
      <esphome-card
        .status=${status}
        .noStatusBar=${true}
        style=${styleMap({
          "--status-color": status === undefined ? "" : STATUS_COLORS[status],
        })}
      >
        <div class="card-header">
          <div class="header-name">
            ${this.device.friendly_name || this.device.name}
          </div>
          <div class="status-badge ${this.onlineStatus ? 'online' : 'offline'}">
            <div class="status-indicator ${this.onlineStatus ? 'online' : 'offline'}"></div>
            <span>${this.onlineStatus ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>

        <div class="card-content">
          ${this.device.configuration !== `${this.device.name}.yaml` &&
          this.device.configuration !== `${this.device.name}.yml`
            ? html`
                <div class="device-config-path">
                  <code>${this.device.configuration}</code>
                </div>
              `
            : ""}
          <div class="network-info">
            <div class="info-row">
              <span class="info-label">IP:</span>
              <span class="info-value">${this._formatAddress()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">mDNS:</span>
              <span class="info-value">${this._formatMDNS()}</span>
            </div>
          </div>
        </div>

        <div class="card-actions">
          <mwc-button
            dense
            @click=${this._handleEdit}
            label="EDIT"
          ></mwc-button>
          <mwc-button
            dense
            @click=${this._handleLogs}
            label="LOGS"
          ></mwc-button>
          <div class="flex"></div>
          <esphome-button-menu
            corner="BOTTOM_RIGHT"
            @action=${this._handleOverflowAction}
          >
            <mwc-icon-button
              slot="trigger"
              icon="more_vert"
              style="--mdc-icon-size: 20px; --mdc-icon-button-size: 28px;"
            ></mwc-icon-button>
            <mwc-list-item graphic="icon">
              Validate
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiSpellcheck}
              ></esphome-svg-icon>
            </mwc-list-item>
            <mwc-list-item graphic="icon">
              Install
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiUploadNetwork}
              ></esphome-svg-icon>
            </mwc-list-item>
            ${this.device.loaded_integrations?.includes("web_server")
              ? html`
                  <mwc-list-item graphic="icon">
                    Visit
                    <mwc-icon slot="graphic">public</mwc-icon>
                  </mwc-list-item>
                `
              : ""}
            <mwc-list-item graphic="icon">
              Show API Key
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiKey}
              ></esphome-svg-icon>
            </mwc-list-item>
            <mwc-list-item graphic="icon">
              Download YAML
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiCodeBraces}
              ></esphome-svg-icon>
            </mwc-list-item>
            <mwc-list-item graphic="icon">
              Rename hostname
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiRenameBox}
              ></esphome-svg-icon>
            </mwc-list-item>
            <mwc-list-item graphic="icon">
              Clean Build Files
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiBroom}
              ></esphome-svg-icon>
            </mwc-list-item>
            <mwc-list-item graphic="icon">
              Download ELF file
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiDownload}
              ></esphome-svg-icon>
            </mwc-list-item>
            <li divider role="separator"></li>
            <mwc-list-item class="warning" graphic="icon">
              Delete
              <esphome-svg-icon
                class="warning"
                slot="graphic"
                .path=${mdiDelete}
              ></esphome-svg-icon>
            </mwc-list-item>
            ${this.device.loaded_integrations?.includes("mqtt")
              ? html`<mwc-list-item graphic="icon">
                  Clean MQTT
                  <esphome-svg-icon
                    slot="graphic"
                    .path=${mdiBroom}
                  ></esphome-svg-icon>
                </mwc-list-item>`
              : ""}
          </esphome-button-menu>
        </div>
      </esphome-card>
    `;
  }

  firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (this.highlightOnAdd) {
      this.highlight();
    }
  }

  static styles = [
    esphomeCardStyles,
    css`
      :host {
        display: block;
      }

      .card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px !important;
      }

      .header-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 16px;
        font-weight: 500;
        margin-right: 8px;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .status-badge.online {
        --status-color: var(--alert-success-color, #1e8e3e);
      }

      .status-badge.offline {
        --status-color: var(--alert-error-color, #d93025);
      }

      .status-badge {
        color: var(--status-color);
      }

      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
        background-color: var(--status-color);
      }

      .device-config-path {
        margin-bottom: 8px;
      }

      .device-config-path code {
        font-size: 11px;
        background-color: var(--code-background-color, rgba(0, 0, 0, 0.05));
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
      }

      .network-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 4px;
      }

      .info-row {
        display: flex;
        align-items: center;
        font-size: 12px;
        line-height: 16px;
      }

      .info-label {
        font-weight: 500;
        width: 48px;
        color: var(--secondary-text-color);
        flex-shrink: 0;
      }

      .info-value {
        color: var(--primary-text-color);
        font-family: monospace;
        font-size: 11px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-actions {
        border-top: 1px solid var(--divider-color);
        padding: 4px 8px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      mwc-button[dense] {
        --mdc-button-horizontal-padding: 8px;
        --mdc-typography-button-font-size: 12px;
        --mdc-button-height: 28px;
      }

      esphome-button-menu {
        --mdc-theme-text-icon-on-background: var(--primary-text-color);
        z-index: 10;
      }
      
      esphome-button-menu esphome-svg-icon {
        fill: var(--primary-text-color);
        color: var(--primary-text-color);
      }

      .warning {
        color: var(--alert-error-color);
      }

      /* Dark mode support */
      @media (prefers-color-scheme: dark) {
        .device-config-path code {
          background-color: rgba(255, 255, 255, 0.05);
        }
      }

      /* Support for HA dark mode */
      :host([data-theme="dark"]) .device-config-path code {
        background-color: rgba(255, 255, 255, 0.05);
      }
    `,
  ];

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    const visitIndex = this.device.loaded_integrations?.includes("web_server")
      ? 2
      : -1;
    const deleteIndex = visitIndex >= 0 ? 9 : 8;
    const mqttIndex = this.device.loaded_integrations?.includes("mqtt")
      ? deleteIndex + 1
      : -1;

    const actionIndex = ev.detail.index;

    switch (actionIndex) {
      case 0:
        openValidateDialog(this.device.configuration);
        break;
      case 1:
        this._handleInstall();
        break;
      case 2:
        if (visitIndex === 2) {
          this._handleVisit();
        } else {
          openShowApiKeyDialog(this.device.configuration);
        }
        break;
      case 3:
        if (visitIndex >= 0) {
          openShowApiKeyDialog(this.device.configuration);
        } else {
          this._handleDownloadYaml();
        }
        break;
      case 4:
        if (visitIndex >= 0) {
          this._handleDownloadYaml();
        } else {
          openRenameDialog(this.device.configuration, this.device.name);
        }
        break;
      case 5:
        if (visitIndex >= 0) {
          openRenameDialog(this.device.configuration, this.device.name);
        } else {
          openCleanDialog(this.device.configuration);
        }
        break;
      case 6:
        if (visitIndex >= 0) {
          openCleanDialog(this.device.configuration);
        } else {
          const type: DownloadType = {
            title: "ELF File",
            description: "ELF File",
            file: "firmware.elf",
            download: `${this.device.name}.elf`,
          };
          const link = document.createElement("a");
          link.download = type.download;
          link.href = getDownloadUrl(this.device.configuration, type);
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        break;
      case 7:
        if (visitIndex >= 0) {
          const type: DownloadType = {
            title: "ELF File",
            description: "ELF File",
            file: "firmware.elf",
            download: `${this.device.name}.elf`,
          };
          const link = document.createElement("a");
          link.download = type.download;
          link.href = getDownloadUrl(this.device.configuration, type);
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
        break;
      case deleteIndex:
        openDeleteDeviceDialog(
          this.device.name,
          this.device.configuration,
          () => fireEvent(this, "deleted"),
        );
        break;
      case mqttIndex:
        if (mqttIndex >= 0) {
          openCleanMQTTDialog(this.device.configuration);
        }
        break;
    }
  }

  private _handleEdit() {
    openEditDialog(this.device.configuration);
  }

  private _handleInstall() {
    openInstallChooseDialog(this.device.configuration);
  }

  private _handleLogs() {
    openLogsTargetDialog(this.device.configuration);
  }

  private _handleVisit() {
    const host =
      this.device.address && !this.device.address.endsWith(".local")
        ? this.device.address
        : `${this.device.name}.local`;
    const url = `http://${host}${
      this.device.web_port && this.device.web_port != 80
        ? `:${this.device.web_port}`
        : ``
    }`;
    window.open(url, "_blank");
  }

  private async _handleDownloadYaml() {
    getFile(this.device.configuration).then((config) => {
      textDownload(config!, this.device.configuration);
    });
  }

  private _formatAddress(): string {
    // First check if we have a resolved IP from the API
    if (this.deviceIP) {
      return this.deviceIP;
    }

    // Fall back to existing logic for devices without resolved IPs
    if (!this.device.address) {
      return this.device.configuration.split(".")[0] + ".local";
    }
    // If it's an mDNS address (ends with .local), return formatted IP placeholder
    if (this.device.address.endsWith(".local")) {
      return "192.168.86.68";
    }
    // Otherwise it's an IP address
    return this.device.address;
  }

  private _formatMDNS(): string {
    // If device has a .local address, use it; otherwise construct from name
    if (this.device.address && this.device.address.endsWith(".local")) {
      return this.device.address;
    }
    return `${this.device.name}.local`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-configured-device-card": ESPHomeConfiguredDeviceCard;
  }
}
