import { LitElement, html, css, nothing, TemplateResult } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
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
import "../components/esphome-button-menu";
import "../components/esphome-svg-icon";
import "../../homeassistant-frontend/src/components/data-table/ha-data-table";
import "../../homeassistant-frontend/src/components/ha-fab";
import "../../homeassistant-frontend/src/components/search-input-outlined";
import "../../homeassistant-frontend/src/components/ha-svg-icon";
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
import { mockHass } from "../util/hass-mock";
import {
  mdiBroom,
  mdiCodeBraces,
  mdiDelete,
  mdiDownload,
  mdiKey,
  mdiPlus,
  mdiRenameBox,
  mdiSpellcheck,
  mdiUploadNetwork,
} from "@mdi/js";
import type {
  DataTableColumnContainer,
  DataTableRowData,
  SortingDirection,
} from "../../homeassistant-frontend/src/components/data-table/ha-data-table";

@customElement("esphome-devices-list")
class ESPHomeDevicesList extends LitElement {
  @property() public showDiscoveredDevices = false;

  @state() private _devices?: Array<ImportableDevice | ConfiguredDevice>;
  @state() private _onlineStatus: Record<string, boolean> = {};
  @state() private _sortBy: "name" | "ip" | "status" = this._loadPreference(
    "sortBy",
    "name",
  ) as "name" | "ip" | "status";
  @state() private _filterStatus: "all" | "online" | "offline" =
    this._loadPreference("filterStatus", "all") as "all" | "online" | "offline";
  @state() private _selected: string[] = [];
  @state() private _activeGrouping?: string;
  @state() private _activeCollapsed: string[] = [];
  @state() private _activeSorting?: SortingDirection;
  @state() private _activeColumnOrder?: string[];
  @state() private _activeHiddenColumns?: string[];
  @state() private _filter: string = "";

  private _devicesUnsub?: ReturnType<typeof subscribeDevices>;
  private _onlineStatusUnsub?: ReturnType<typeof subscribeOnlineStatus>;
  private _new = new Set<string>();

  private _isImportable = (item: any): item is ImportableDevice => {
    return "package_import_url" in item;
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
      icon: {
        title: "",
        sortable: false,
        minWidth: "48px",
        maxWidth: "48px",
        template: (row: DataTableRowData) => this._renderDeviceIcon(row),
      },
      name: {
        title: "Name",
        sortable: true,
        filterable: true,
        groupable: true,
        direction: "asc",
        flexGrow: 2,
        template: (row: DataTableRowData) => this._renderDeviceInfo(row),
      },
      status: {
        title: "Status",
        sortable: true,
        filterable: true,
        groupable: true,
        width: "80px",
        template: (row: DataTableRowData) => this._renderStatus(row),
      },
      ip_address: {
        title: "Address",
        sortable: true,
        filterable: true,
        width: "150px",
        template: (row: DataTableRowData) => row.ip_address || "-",
      },
      platform: {
        title: "Platform",
        sortable: true,
        filterable: true,
        groupable: true,
        hidden: true,
        width: "90px",
        template: (row: DataTableRowData) => row.platform || "-",
      },
      filename: {
        title: "File name",
        sortable: true,
        filterable: true,
        width: "200px",
        template: (row: DataTableRowData) => this._renderFileName(row),
      },
      actions: {
        title: "",
        sortable: false,
        width: "160px",
        template: (row: DataTableRowData) => this._renderActions(row),
      },
    };
  }

  private _renderDeviceIcon(row: DataTableRowData): TemplateResult {
    const icon =
      row.platform === "ESP32"
        ? "📟"
        : row.platform === "ESP8266"
          ? "📱"
          : "🔌";
    return html`
      <div class="device-icon">
        <span class="icon">${icon}</span>
      </div>
    `;
  }

  private _renderDeviceInfo(row: DataTableRowData): TemplateResult {
    return html`
      <div class="device-info">
        <div class="device-name">${row.friendly_name || row.name}</div>
        <div class="device-description">
          ${row.comment || row.platform || "ESPHome Device"}
        </div>
      </div>
    `;
  }

  private _renderFileName(row: DataTableRowData): TemplateResult {
    return html`
      <span class="filename">
        ${row.configuration
          ? html`<code>${row.configuration}</code>`
          : html`<span class="no-config">—</span>`}
      </span>
    `;
  }

  private _renderStatus(row: DataTableRowData): TemplateResult {
    if (row.type === "importable") {
      return html`
        <span class="status-badge status-discovered"> Discovered </span>
      `;
    }

    const isOnline = this._onlineStatus[row.configuration];
    return html`
      <span
        class="status-badge ${isOnline ? "status-online" : "status-offline"}"
      >
        ${isOnline ? "Online" : "Offline"}
      </span>
    `;
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
      // Ensure we have an id field for the data table
      id: device.name,
      type: this._isImportable(device) ? "importable" : "configured",
      // Add computed fields for sorting
      status: this._isImportable(device)
        ? "Discovered"
        : this._onlineStatus[(device as ConfiguredDevice).configuration]
          ? "Online"
          : "Offline",
      ip_address: this._isImportable(device)
        ? device.network || "-"
        : (device as ConfiguredDevice).address || "-",
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
    const filteredData = this._getFilteredData(tableData);

    return html`
      <div class="table-container">
        <div class="toolbar">
          <search-input-outlined
            .filter=${this._filter}
            @value-changed=${this._handleSearchChange}
            .label=${`Search ${tableData.length} devices`}
          ></search-input-outlined>
        </div>
        <ha-data-table
          .hass=${mockHass}
          .columns=${this._getTableColumns()}
          .data=${filteredData}
          .filter=${this._filter || ""}
          .noDataText=${"No devices found"}
          .id=${"name"}
          clickable
          @row-click=${this._handleTableRowClick}
        ></ha-data-table>
        <ha-fab
          .label=${"New device"}
          extended
          @click=${this._handleOpenWizardClick}
        >
          <ha-svg-icon slot="icon" .path=${mdiPlus}></ha-svg-icon>
        </ha-fab>
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
          (a.friendly_name || a.name).localeCompare(b.friendly_name || b.name),
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
          Online: 0,
          Offline: 1,
          Discovered: 2,
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
    // Don't trigger row click if clicking on action buttons
    const path = e.composedPath();
    const clickedOnAction = path.some((el: EventTarget) => {
      if (el instanceof HTMLElement) {
        return (
          el.tagName === "MWC-BUTTON" ||
          el.tagName === "MWC-ICON-BUTTON" ||
          el.tagName === "ESPHOME-BUTTON-MENU" ||
          el.classList?.contains("actions-container")
        );
      }
      return false;
    });

    if (clickedOnAction) {
      return;
    }

    const deviceId = e.detail.id;
    const device = this._getTableData().find(d => d.id === deviceId || d.name === deviceId);
    if (!device) return;

    if (device.type === "importable") {
      openAdoptDialog(device as ImportableDevice, () => this._updateDevices());
    } else if (device.configuration) {
      openEditDialog(device.configuration);
    }
  }

  private _handleSelectionChanged(ev: CustomEvent): void {
    this._selected = ev.detail.value;
  }

  private _handleColumnsChanged(ev: CustomEvent): void {
    this._activeColumnOrder = ev.detail.columnOrder;
    this._activeHiddenColumns = ev.detail.hiddenColumns;
    this._saveTablePreferences();
  }

  private _handleGroupingChanged(ev: CustomEvent): void {
    this._activeGrouping = ev.detail.value;
    this._saveTablePreferences();
  }

  private _handleCollapseChanged(ev: CustomEvent): void {
    this._activeCollapsed = ev.detail.value;
  }

  private _handleSearchChange(ev: CustomEvent): void {
    this._filter = ev.detail.value || "";
  }

  private _clearFilter(): void {
    this._filter = "";
  }

  private _getFilteredData(data: DataTableRowData[]): DataTableRowData[] {
    if (!this._filter) {
      return data;
    }
    const searchValue = this._filter.toLowerCase();
    return data.filter((item) => {
      if (item.name?.toLowerCase().includes(searchValue)) return true;
      if (item.friendly_name?.toLowerCase().includes(searchValue)) return true;
      if (item.comment?.toLowerCase().includes(searchValue)) return true;
      if (item.platform?.toLowerCase().includes(searchValue)) return true;
      if (item.configuration?.toLowerCase().includes(searchValue)) return true;
      return false;
    });
  }

  private _saveTablePreferences(): void {
    try {
      if (this._activeColumnOrder) {
        localStorage.setItem(
          "esphome.tableColumnOrder",
          JSON.stringify(this._activeColumnOrder),
        );
      }
      if (this._activeHiddenColumns) {
        localStorage.setItem(
          "esphome.tableHiddenColumns",
          JSON.stringify(this._activeHiddenColumns),
        );
      }
      if (this._activeGrouping) {
        localStorage.setItem("esphome.tableGrouping", this._activeGrouping);
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  private _handleShowDiscovered() {
    fireEvent(this, "toggle-discovered-devices");
  }

  private _handleViewModeChange = () => {
    this.requestUpdate();
  };

  private _handleColumnsChange = () => {
    this.requestUpdate();
  };

  private _handleOpenWizardClick() {
    openWizardDialog();
  }

  static styles = css`
    :host {
      display: block;
      height: 100%;
      background-color: var(--primary-background-color);
    }

    .table-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
    }

    .toolbar {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      gap: 8px;
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    }

    .toolbar search-input-outlined {
      flex: 1;
      max-width: 400px;
    }

    ha-data-table {
      flex: 1;
      width: 100%;
      --data-table-border-width: 1px;
      --data-table-row-border-width: 1px;
      --data-table-row-border-color: var(--divider-color, rgba(0, 0, 0, 0.12));
    }

    /* Row divider lines */
    ha-data-table::part(row) {
      border-bottom: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
    }

    ha-fab {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 1000;
    }

    @media (max-width: 600px) {
      ha-fab {
        bottom: 84px;
      }
    }

    .device-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--secondary-background-color, #f5f5f5);
    }

    .device-icon .icon {
      font-size: 20px;
    }

    .device-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .device-name {
      font-weight: 500;
      color: var(--primary-text-color, #212121);
      font-size: 14px;
    }

    .device-description {
      font-size: 12px;
      color: var(--secondary-text-color, #727272);
    }

    .filename code {
      font-family: monospace;
      font-size: 12px;
      padding: 2px 6px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 4px;
    }

    .filename .no-config {
      color: var(--secondary-text-color, #727272);
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      display: inline-block;
    }

    .status-online {
      background-color: #4caf50;
      color: white;
    }

    .status-offline {
      background-color: #f44336;
      color: white;
    }

    .status-discovered {
      background-color: #ff9800;
      color: white;
    }

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
      z-index: 100;
    }

    /* Ensure menu popups appear above everything */
    esphome-button-menu mwc-menu {
      z-index: 1000;
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
    html[data-theme="dark"]
      .actions-container
      esphome-button-menu
      esphome-svg-icon {
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
