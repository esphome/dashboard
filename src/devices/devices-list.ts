import { LitElement, html, css, nothing, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import {
  subscribeDevices,
  ImportableDevice,
  ConfiguredDevice,
  canUpdateDevice,
} from "../api/devices";
import { openWizardDialog } from "../wizard";
import { openAdoptDialog } from "../adopt";
import "@material/mwc-button";
import "@material/mwc-textfield";
import "@material/mwc-icon-button";
import "@material/mwc-list/mwc-list-item";
import { subscribeOnlineStatus } from "../api/online-status";
import "./configured-device-card";
import "./importable-device-card";
import "../components/esphome-search";
import "../components/esphome-button-menu";
import "../components/esphome-svg-icon";
import "../components/esphome-data-table";
import { ESPHomeSearch } from "../components/esphome-search";
import { fireEvent } from "../util/fire-event";
import { openValidateDialog } from "../validate";
import { openLogsTargetDialog } from "../logs-target";
import { openInstallChooseDialog } from "../install-choose";
import { openDeleteDeviceDialog } from "../delete-device";
import { openEditDialog } from "../editor";
import { openCleanDialog } from "../clean";
import { openRenameDialog } from "../rename";
import { openShowApiKeyDialog } from "../show-api-key";
import { getFile } from "../api/files";
import { textDownload } from "../util/file-download";
import { DownloadType, getDownloadUrl } from "../api/download";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
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
import { getDeviceIPs } from "../api/device-ips";
import {
  DataTableColumnContainer,
  DataTableRowData,
} from "../components/esphome-data-table";

@customElement("esphome-devices-list")
class ESPHomeDevicesList extends LitElement {
  @property() public showDiscoveredDevices = false;

  @state() private _devices?: Array<ImportableDevice | ConfiguredDevice>;
  @state() private _onlineStatus: Record<string, boolean> = {};
  @state() private _deviceIPs: Record<string, string | null> = {};
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

  @query("esphome-search") private _search!: ESPHomeSearch;

  private _devicesUnsub?: ReturnType<typeof subscribeDevices>;
  private _onlineStatusUnsub?: ReturnType<typeof subscribeOnlineStatus>;
  private _new = new Set<string>();
  private _deviceIPsRefreshInterval?: number;

  private _isImportable = (item: any): item is ImportableDevice => {
    return "package_import_url" in item;
  };

  private _handleViewModeChange = (e: CustomEvent) => {
    this._viewMode = e.detail.viewMode;
    this._savePreference("viewMode", this._viewMode);
  };

  private _handleSortChange = (e: CustomEvent) => {
    this._sortBy = e.detail.sortBy;
    this._savePreference("sortBy", this._sortBy);
    this.requestUpdate();
  };

  private _handleFilterChange = (e: CustomEvent) => {
    this._filterStatus = e.detail.filterStatus;
    this._savePreference("filterStatus", this._filterStatus);
  };

  private _handleColumnsChange = (e: CustomEvent) => {
    this._cardColumns = e.detail.columns;
    this._savePreference("cardColumns", String(this._cardColumns));
  };

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

  private _getTableColumns(): DataTableColumnContainer {
    return {
      status_indicator: {
        title: "",
        sortable: false,
        width: "24px",
        template: (data: any, row: DataTableRowData) =>
          this._renderStatusIndicator(row),
      },
      name: {
        title: "Name",
        sortable: true,
        filterable: true,
        template: (data: any, row: DataTableRowData) =>
          this._renderDeviceName(row),
      },
      status: {
        title: "Status",
        sortable: true,
        template: (data: any, row: DataTableRowData) => this._renderStatus(row),
      },
      ip_address: {
        title: "IP Address",
        sortable: true,
        template: (data: any, row: DataTableRowData) =>
          this._renderIPAddress(row),
      },
      mdns: {
        title: "mDNS",
        sortable: false,
        template: (data: any, row: DataTableRowData) => this._renderMDNS(row),
      },
      actions: {
        title: "Actions",
        sortable: false,
        template: (data: any, row: DataTableRowData) =>
          this._renderActions(row),
      },
    };
  }

  private _renderStatusIndicator(row: DataTableRowData): TemplateResult {
    if (row.type === "importable") {
      return html`<div class="status-indicator discovered"></div>`;
    }

    const isOnline = this._onlineStatus[row.configuration];
    return html`<div
      class="status-indicator ${isOnline ? "online" : "offline"}"
    ></div>`;
  }

  private _renderDeviceName(row: DataTableRowData): string {
    return row.friendly_name || row.name;
  }

  private _renderStatus(row: DataTableRowData): TemplateResult {
    if (row.type === "importable") {
      return html`
        <span class="status-badge discovered">
          <div class="status-indicator discovered"></div>
          Discovered
        </span>
      `;
    }

    const isOnline = this._onlineStatus[row.configuration];
    return html`
      <span class="status-badge ${isOnline ? "online" : "offline"}">
        <div class="status-indicator ${isOnline ? "online" : "offline"}"></div>
        ${isOnline ? "Online" : "Offline"}
      </span>
    `;
  }

  private _renderIPAddress(row: DataTableRowData): string {
    if (row.type === "importable") {
      return row.network || "-";
    }

    // First check if we have a resolved IP from the API
    const resolvedIP = this._deviceIPs[row.name];
    if (resolvedIP) {
      return resolvedIP;
    }

    // Fall back to existing logic for devices without resolved IPs
    if (!row.address) {
      return "-";
    }
    // If it's an mDNS address (ends with .local), return dash
    if (row.address.endsWith(".local")) {
      return "-";
    }
    // Otherwise it's an IP address
    return row.address;
  }

  private _renderMDNS(row: DataTableRowData): string {
    if (row.type === "importable") {
      return "-";
    }

    // If device has a .local address, use it; otherwise construct from configuration filename
    if (row.address && row.address.endsWith(".local")) {
      return row.address;
    }
    // Use configuration filename without .yaml/.yml extension
    const filename = row.configuration.replace(/\.(yaml|yml)$/, '');
    return `${filename}.local`;
  }

  private _renderActions(row: DataTableRowData): TemplateResult {
    if (row.type === "importable") {
      const device = row as ImportableDevice;
      return html`
        <mwc-button
          unelevated
          @click=${() => openAdoptDialog(device, () => this._updateDevices())}
          label="Adopt"
        ></mwc-button>
      `;
    }

    const device = row as ConfiguredDevice;
    const isOnline = this._onlineStatus[device.configuration];
    const canUpdate = canUpdateDevice(device);

    return html`
      <div class="actions-container">
        ${canUpdate && isOnline
          ? html`
              <mwc-button
                unelevated
                @click=${() => openInstallChooseDialog(device.configuration)}
                label="Update"
              ></mwc-button>
            `
          : nothing}
        ${device.web_port && isOnline
          ? html`
              <mwc-button
                outlined
                @click=${() => {
                  const host =
                    device.address && !device.address.endsWith(".local")
                      ? device.address
                      : `${device.name}.local`;
                  const url = `http://${host}:${device.web_port}`;
                  window.open(url, "_blank");
                }}
                label="Visit"
              ></mwc-button>
            `
          : nothing}
        <mwc-button
          outlined
          @click=${() => openEditDialog(device.configuration)}
          label="Edit"
        ></mwc-button>
        <mwc-button
          outlined
          @click=${() => openLogsTargetDialog(device.configuration)}
          label="Logs"
        ></mwc-button>
        <esphome-button-menu
          corner="BOTTOM_RIGHT"
          @action=${(ev: CustomEvent<ActionDetail>) =>
            this._handleOverflowAction(ev, device)}
        >
          <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
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
          <mwc-list-item graphic="icon">
            Show API Key
            <esphome-svg-icon slot="graphic" .path=${mdiKey}></esphome-svg-icon>
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
        </esphome-button-menu>
      </div>
    `;
  }

  private _getTableData(): DataTableRowData[] {
    if (!this._devices) return [];

    let devices = [...this._devices];

    // Apply status filter first
    if (this._filterStatus !== "all") {
      devices = devices.filter((device) => {
        if (this._isImportable(device)) return true; // Always show importable devices

        const isOnline =
          this._onlineStatus[(device as ConfiguredDevice).configuration];
        if (this._filterStatus === "online") return isOnline;
        if (this._filterStatus === "offline") return !isOnline;
        return true;
      });
    }

    // Convert to table row data
    return devices.map((device) => ({
      ...device,
      type: this._isImportable(device) ? "importable" : "configured",
      // Add computed fields for sorting
      status: this._isImportable(device)
        ? "Discovered"
        : this._onlineStatus[(device as ConfiguredDevice).configuration]
          ? "Online"
          : "Offline",
      ip_address: this._isImportable(device)
        ? device.network || "-"
        : this._deviceIPs[device.name] ||
          (device as ConfiguredDevice).address ||
          "-",
      name: device.friendly_name || device.name,
    }));
  }

  protected render() {
    // catch when 1st load there is no data yet, and we don't want to show no devices message
    if (!this._devices) {
      return html``;
    }

    if (this._devices.length === 0) {
      return html`
        <div class="no-result-container">
          <h5>Welcome to ESPHome</h5>
          <p>It looks like you don't yet have any devices.</p>
          <p>
            <mwc-button
              raised
              label="New device"
              icon="add"
              @click=${this._handleOpenWizardClick}
            ></mwc-button>
          </p>
        </div>
      `;
    }

    const tableData = this._getTableData();
    
    const discoveredCount = this._devices.filter(
      (item) => this._isImportable(item) && !item.ignored,
    ).length;

    if (this._viewMode === "cards") {
      let filteredData = tableData.filter((item) => this._filter(item));
      
      // Apply sorting to card view
      filteredData = this._sortData(filteredData);
      
      // Use existing card implementation
      let htmlClass = "no-result-container";
      let htmlDevices = html`
        <h5>No devices found</h5>
        <p>Adjust your search criteria.</p>
      `;

      if (filteredData.length > 0) {
        htmlClass = `grid grid-${this._cardColumns}`;
        htmlDevices = html`${repeat(
          filteredData,
          (device) => device.name,
          (device) => html`
            ${device.type === "importable"
              ? html`<esphome-importable-device-card
                  .device=${device}
                  @device-updated=${this._updateDevices}
                ></esphome-importable-device-card>`
              : html`<esphome-configured-device-card
                  data-name=${device.name}
                  .device=${device}
                  .onlineStatus=${this._onlineStatus[device.configuration]}
                  .deviceIP=${this._deviceIPs[device.name]}
                  .highlightOnAdd=${this._new.has(device.name)}
                  @deleted=${this._updateDevices}
                ></esphome-configured-device-card>`}
          `,
        )}`;
      }

      return html`
        <esphome-search @input=${() => this.requestUpdate()}></esphome-search>
        ${!this.showDiscoveredDevices && discoveredCount > 0
          ? html`
              <div class="show-discovered-bar">
                <span>
                  Discovered ${discoveredCount}
                  device${discoveredCount == 1 ? "" : "s"}
                </span>
                <mwc-button
                  label="Show"
                  @click=${this._handleShowDiscovered}
                ></mwc-button>
              </div>
            `
          : nothing}
        <div class="${htmlClass}">${htmlDevices}</div>
      `;
    }

    // Table view using HA-style data table
    return html`
      <esphome-search @input=${() => this.requestUpdate()}></esphome-search>
      ${!this.showDiscoveredDevices && discoveredCount > 0
        ? html`
            <div class="show-discovered-bar">
              <span>
                Discovered ${discoveredCount}
                device${discoveredCount == 1 ? "" : "s"}
              </span>
              <mwc-button
                label="Show"
                @click=${this._handleShowDiscovered}
              ></mwc-button>
            </div>
          `
        : nothing}
      <div class="table-container">
        <esphome-data-table
          .columns=${this._getTableColumns()}
          .data=${tableData}
          .sortColumn=${this._getSortColumn()}
          .sortDirection=${this._getSortDirection()}
          .filter=${this._search?.value || ""}
          .noDataText=${"No devices found. Adjust your search criteria."}
          @sorting-changed=${this._handleTableSortChange}
          @row-click=${this._handleTableRowClick}
        ></esphome-data-table>
      </div>
    `;
  }

  private _getSortColumn(): string | undefined {
    switch (this._sortBy) {
      case "name":
        return "name";
      case "ip":
        return "ip_address";
      case "status":
        return "status";
      default:
        return "name";
    }
  }

  private _getSortDirection(): "asc" | "desc" | null {
    // Always return ascending for now
    return "asc";
  }

  private _sortData(data: DataTableRowData[]): DataTableRowData[] {
    const sortedData = [...data];
    
    switch (this._sortBy) {
      case "name":
        sortedData.sort((a, b) => 
          (a.friendly_name || a.name).localeCompare(b.friendly_name || b.name)
        );
        break;
      case "ip":
        sortedData.sort((a, b) => {
          const aIp = a.ip_address || "";
          const bIp = b.ip_address || "";
          return aIp.localeCompare(bIp);
        });
        break;
      case "status":
        // Sort by status: Online first, then Offline, then Discovered
        const statusOrder: { [key: string]: number } = {
          "Online": 0,
          "Offline": 1,
          "Discovered": 2
        };
        sortedData.sort((a, b) => {
          const aOrder = statusOrder[a.status] ?? 3;
          const bOrder = statusOrder[b.status] ?? 3;
          return aOrder - bOrder;
        });
        break;
    }
    
    return sortedData;
  }

  private _handleTableSortChange(e: CustomEvent) {
    const { column, direction } = e.detail;

    if (!column || !direction) {
      this._sortBy = "name";
    } else {
      switch (column) {
        case "name":
          this._sortBy = "name";
          break;
        case "ip_address":
          this._sortBy = "ip";
          break;
        case "status":
          this._sortBy = "status";
          break;
        default:
          this._sortBy = "name";
      }
    }

    this._savePreference("sortBy", this._sortBy);
    this.requestUpdate();
  }

  private _handleTableRowClick(e: CustomEvent) {
    // Handle row click if needed
  }

  private _filter(item: DataTableRowData): boolean {
    if (!this.showDiscoveredDevices && item.type === "importable") {
      return false;
    }

    if (this._search?.value) {
      const searchValue = this._search!.value.toLowerCase();
      if (item.name!.toLowerCase().indexOf(searchValue) >= 0) {
        return true;
      }
      if (
        item.friendly_name &&
        item.friendly_name!.toLowerCase().indexOf(searchValue) >= 0
      ) {
        return true;
      }
      if (
        item.comment &&
        item.comment!.toLowerCase().indexOf(searchValue) >= 0
      ) {
        return true;
      }
      if (
        item.project_name &&
        item.project_name!.toLowerCase().indexOf(searchValue) >= 0
      ) {
        return true;
      }
      return false;
    }
    return true;
  }

  private _handleShowDiscovered() {
    fireEvent(this, "toggle-discovered-devices");
  }

  private _handleOpenWizardClick() {
    openWizardDialog();
  }

  static styles = css`
    .grid {
      display: grid;
      grid-column-gap: 1rem;
      grid-row-gap: 1rem;
      margin: 20px auto;
      width: 90%;
      max-width: 1920px;
      justify-content: stretch;
    }
    .grid-1 {
      grid-template-columns: 1fr;
    }
    .grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .grid-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    .grid-5 {
      grid-template-columns: repeat(5, 1fr);
    }
    @media only screen and (max-width: 1400px) {
      .grid-5 {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    @media only screen and (max-width: 1100px) {
      .grid-4,
      .grid-5 {
        grid-template-columns: repeat(3, 1fr);
      }
      .grid-3 {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media only screen and (max-width: 750px) {
      .grid-2,
      .grid-3,
      .grid-4,
      .grid-5 {
        grid-template-columns: 1fr;
      }
      .container {
        width: 100%;
      }
    }
    esphome-configured-device-card,
    esphome-importable-device-card {
      margin: 0;
    }
    .no-result-container {
      text-align: center;
      margin-top: 40px;
      color: var(--primary-text-color);
    }
    h5 {
      font-size: 1.64rem;
      line-height: 110%;
      font-weight: 400;
      margin: 1rem 0 0.65rem 0;
    }
    .show-discovered-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 8px 8px 16px;
      background-color: var(--primary-footer-bg-color);
      border-top: 1px solid var(--divider-color);
      color: var(--mdc-theme-on-primary);
    }
    .table-container {
      margin: 20px auto;
      width: 90%;
      max-width: 1920px;
    }
    .actions-container {
      display: flex;
      gap: 8px;
      align-items: center;
      flex-wrap: wrap;
    }
    .actions-container mwc-button {
      --mdc-theme-primary: var(--primary-text-color);
      --mdc-button-horizontal-padding: 8px;
      font-size: 14px;
    }
    .actions-container mwc-button[unelevated] {
      --mdc-theme-primary: var(--primary-text-color);
      --mdc-theme-on-primary: var(--card-background-color);
    }
    esphome-button-menu {
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
      position: relative;
      z-index: 1;
    }
    /* Fix icon colors in dropdown menus */
    esphome-button-menu {
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
    }
    esphome-button-menu mwc-list-item {
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
      --mdc-list-item-graphic-color: var(--primary-text-color);
    }
    esphome-button-menu esphome-svg-icon {
      fill: var(--primary-text-color) !important;
      color: var(--primary-text-color) !important;
    }
    .actions-container esphome-button-menu esphome-svg-icon {
      fill: var(--primary-text-color) !important;
      color: var(--primary-text-color) !important;
    }
    /* Target the SVG icon slot */
    esphome-button-menu mwc-list-item [slot="graphic"] {
      color: var(--primary-text-color) !important;
    }
    /* Target the SVG path directly */
    esphome-button-menu mwc-list-item[graphic="icon"] {
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
    }
    esphome-button-menu mwc-list-item esphome-svg-icon,
    esphome-button-menu mwc-list-item esphome-svg-icon svg,
    esphome-button-menu mwc-list-item esphome-svg-icon svg path {
      fill: var(--primary-text-color) !important;
    }
    /* Override Material Web Component default styles */
    .actions-container esphome-button-menu mwc-list {
      --mdc-list-item-graphic-color: var(--primary-text-color) !important;
    }
    /* Dark mode specific fixes */
    @media (prefers-color-scheme: dark) {
      esphome-button-menu mwc-list-item [slot="graphic"],
      esphome-button-menu esphome-svg-icon,
      .actions-container esphome-button-menu esphome-svg-icon {
        color: var(--primary-text-color, rgba(255, 255, 255, 0.87)) !important;
        fill: var(--primary-text-color, rgba(255, 255, 255, 0.87)) !important;
      }
    }
    /* Home Assistant dark mode */
    html[data-theme="dark"] esphome-button-menu mwc-list-item [slot="graphic"],
    html[data-theme="dark"] esphome-button-menu esphome-svg-icon,
    html[data-theme="dark"] .actions-container esphome-button-menu esphome-svg-icon {
      color: var(--primary-text-color, rgba(255, 255, 255, 0.87)) !important;
      fill: var(--primary-text-color, rgba(255, 255, 255, 0.87)) !important;
    }
    /* Fix all icons in action menus */
    esphome-button-menu mwc-icon {
      color: var(--primary-text-color) !important;
    }
    .actions-container mwc-icon {
      color: var(--primary-text-color) !important;
    }
    .warning {
      color: var(--alert-error-color);
    }
    .warning mwc-icon,
    .warning esphome-svg-icon {
      color: var(--alert-error-color) !important;
      fill: var(--alert-error-color) !important;
    }
  `;

  private async _updateDevices() {
    await this._devicesUnsub!.refresh();
  }

  private async _handleOverflowAction(
    ev: CustomEvent<ActionDetail>,
    device: ConfiguredDevice,
  ) {
    switch (ev.detail.index) {
      case 0:
        openValidateDialog(device.configuration);
        break;
      case 1:
        openInstallChooseDialog(device.configuration);
        break;
      case 2:
        openShowApiKeyDialog(device.configuration);
        break;
      case 3:
        this._handleDownloadYaml(device);
        break;
      case 4:
        openRenameDialog(device.configuration, device.name);
        break;
      case 5:
        openCleanDialog(device.configuration);
        break;
      case 6:
        const type: DownloadType = {
          title: "ELF File",
          description: "ELF File",
          file: "firmware.elf",
          download: `${device.name}.elf`,
        };
        const link = document.createElement("a");
        link.download = type.download;
        link.href = getDownloadUrl(device.configuration, type);
        document.body.appendChild(link);
        link.click();
        link.remove();
        break;
      case 8: // After the divider
        openDeleteDeviceDialog(device.name, device.configuration, () =>
          this._updateDevices(),
        );
        break;
    }
  }

  private async _handleDownloadYaml(device: ConfiguredDevice) {
    getFile(device.configuration).then((config) => {
      textDownload(config!, device.configuration);
    });
  }

  private async _fetchDeviceIPs() {
    try {
      const deviceIPs = await getDeviceIPs();
      this._deviceIPs = deviceIPs;
    } catch (error) {
      console.warn("Failed to fetch device IPs:", error);
    }
  }

  public connectedCallback() {
    super.connectedCallback();

    document.addEventListener(
      "view-mode-changed",
      this._handleViewModeChange as EventListener,
    );
    document.addEventListener(
      "sort-changed",
      this._handleSortChange as EventListener,
    );
    document.addEventListener(
      "filter-changed",
      this._handleFilterChange as EventListener,
    );
    document.addEventListener(
      "columns-changed",
      this._handleColumnsChange as EventListener,
    );

    this._fetchDeviceIPs();
    this._deviceIPsRefreshInterval = window.setInterval(() => {
      this._fetchDeviceIPs();
    }, 30000);

    this._devicesUnsub = subscribeDevices(async (devices) => {
      if (!devices) return;

      const newDevices = new Set<string>();
      let newList: Array<ImportableDevice | ConfiguredDevice> = [];

      if (devices.configured) {
        devices.configured.forEach((d) => {
          if (
            this._devices &&
            this._devices.filter((old) => old.name === d.name).length === 0
          ) {
            newDevices.add(d.name);
          }
          newList.push(d);
        });
      }

      if (devices.importable) {
        newList = [...devices.importable, ...newList];
      }

      this._devices = newList;
      this._new = newDevices;
    });

    this._onlineStatusUnsub = subscribeOnlineStatus((res) => {
      this._onlineStatus = res;
    });
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this._devicesUnsub) {
      this._devicesUnsub();
    }
    if (this._onlineStatusUnsub) {
      this._onlineStatusUnsub();
    }
    if (this._deviceIPsRefreshInterval) {
      clearInterval(this._deviceIPsRefreshInterval);
    }

    document.removeEventListener(
      "view-mode-changed",
      this._handleViewModeChange as EventListener,
    );
    document.removeEventListener(
      "sort-changed",
      this._handleSortChange as EventListener,
    );
    document.removeEventListener(
      "filter-changed",
      this._handleFilterChange as EventListener,
    );
    document.removeEventListener(
      "columns-changed",
      this._handleColumnsChange as EventListener,
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-devices-list": ESPHomeDevicesList;
  }
}