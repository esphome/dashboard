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
import "../../homeassistant-frontend/src/components/search-input-outlined";
import "../../homeassistant-frontend/src/components/chips/ha-assist-chip";
import "../../homeassistant-frontend/src/components/chips/ha-filter-chip";
import "../../homeassistant-frontend/src/components/ha-md-button-menu";
import "../../homeassistant-frontend/src/components/ha-md-menu-item";
import "../../homeassistant-frontend/src/components/ha-svg-icon";
import "../../homeassistant-frontend/src/components/ha-icon-button";
import "../../homeassistant-frontend/src/components/ha-expansion-panel";
import "../../homeassistant-frontend/src/components/ha-dialog";
import "../../homeassistant-frontend/src/components/ha-dialog-header";
import "../../homeassistant-frontend/src/components/ha-button";
import "../../homeassistant-frontend/src/components/ha-list";
import "../../homeassistant-frontend/src/components/ha-list-item";
import "../../homeassistant-frontend/src/components/ha-sortable";
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
  mdiArrowDown,
  mdiArrowUp,
  mdiClose,
  mdiDrag,
  mdiEye,
  mdiEyeOff,
  mdiFilterVariant,
  mdiFilterVariantRemove,
  mdiLock,
  mdiMenuDown,
  mdiPencil,
  mdiTableCog,
} from "@mdi/js";
import { supportedPlatforms, type SupportedPlatforms } from "../const";
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
  @state() private _filterStatus: "all" | "online" | "offline" =
    this._loadPreference("filterStatus", "all") as "all" | "online" | "offline";
  @state() private _groupColumn?: string = this._loadPreference("groupColumn", "") || undefined;
  @state() private _sortColumn?: string = this._loadPreference("sortColumn", "name") || undefined;
  @state() private _sortDirection: SortingDirection = (this._loadPreference("sortDirection", "asc") as SortingDirection) || null;
  @state() private _filter: string = "";
  @state() private _columnOrder?: string[];
  @state() private _hiddenColumns?: string[];
  @state() private _showFilters = false;
  @state() private _showSettingsDialog = false;
  @state() private _rowHeight: "compact" | "default" | "comfortable" =
    this._loadPreference("rowHeight", "default") as "compact" | "default" | "comfortable";

  private _devicesUnsub?: ReturnType<typeof subscribeDevices>;
  private _onlineStatusUnsub?: ReturnType<typeof subscribeOnlineStatus>;
  private _new = new Set<string>();

  private _isImportable = (item: any): item is ImportableDevice => {
    return "package_import_url" in item;
  };


  private _handleFilterChange = (e: CustomEvent) => {
    this._filterStatus = e.detail.filterStatus;
    this._savePreference("filterStatus", this._filterStatus);
  };

  private _handleSortBy = (e: Event) => {
    const target = e.currentTarget as HTMLElement;
    const columnId = (target as any).value;
    if (!this._sortDirection || this._sortColumn !== columnId) {
      this._sortDirection = "asc";
    } else if (this._sortDirection === "asc") {
      this._sortDirection = "desc";
    } else {
      this._sortDirection = null;
    }
    this._sortColumn = this._sortDirection === null ? undefined : columnId;
    this._savePreference("sortColumn", this._sortColumn || "");
    this._savePreference("sortDirection", this._sortDirection || "");
  };

  private _handleSortingChanged = (e: CustomEvent) => {
    this._sortDirection = e.detail.direction;
    this._sortColumn = this._sortDirection ? e.detail.column : undefined;
    this._savePreference("sortColumn", this._sortColumn || "");
    this._savePreference("sortDirection", this._sortDirection || "");
  };

  private _handleGroupBy = (e: Event) => {
    const target = e.currentTarget as HTMLElement;
    const columnId = (target as any).value;
    this._groupColumn = columnId || undefined;
    this._savePreference("groupColumn", this._groupColumn || "");
  };

  private _toggleFilters = () => {
    this._showFilters = !this._showFilters;
  };

  private _setStatusFilter = (status: "all" | "online" | "offline") => {
    this._filterStatus = status;
    this._savePreference("filterStatus", this._filterStatus);
  };

  private _clearFilters = () => {
    this._filterStatus = "all";
    this._savePreference("filterStatus", "all");
  };

  private _openSettings = () => {
    this._showSettingsDialog = true;
  };

  private _closeSettingsDialog = () => {
    this._showSettingsDialog = false;
  };

  private _toggleColumnVisibility = (columnId: string) => {
    const hiddenColumns = [...(this._hiddenColumns || [])];
    const idx = hiddenColumns.indexOf(columnId);
    if (idx >= 0) {
      hiddenColumns.splice(idx, 1);
    } else {
      hiddenColumns.push(columnId);
    }
    this._hiddenColumns = hiddenColumns;
    this._savePreference("hiddenColumns", JSON.stringify(hiddenColumns));
  };

  private _resetColumnSettings = () => {
    this._columnOrder = undefined;
    this._hiddenColumns = undefined;
    this._rowHeight = "default";
    this._savePreference("columnOrder", "[]");
    this._savePreference("hiddenColumns", "[]");
    this._savePreference("rowHeight", "default");
    this._closeSettingsDialog();
  }

  private _setRowHeight = (height: "compact" | "default" | "comfortable") => {
    this._rowHeight = height;
    this._savePreference("rowHeight", height);
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
      name: {
        title: "Name",
        sortable: true,
        groupable: true,
        direction: "asc",
        flexGrow: 2,
        template: (row: DataTableRowData) => this._renderDeviceInfo(row),
      },
      status: {
        title: "Status",
        sortable: true,
        groupable: true,
        template: (row: DataTableRowData) => this._renderStatus(row),
      },
      device_type: {
        title: "Device Type",
        sortable: true,
        groupable: true,
        template: (row: DataTableRowData) => this._renderDeviceType(row),
      },
      ip_address: {
        title: "Address",
        sortable: true,
        template: (row: DataTableRowData) => this._renderAddress(row),
      },
      filename: {
        title: "File name",
        sortable: true,
        template: (row: DataTableRowData) => this._renderFileName(row),
      },
      actions: {
        title: "",
        sortable: false,
        template: (row: DataTableRowData) => this._renderActions(row),
      },
    };
  }

  private _renderDeviceInfo(row: DataTableRowData): TemplateResult {
    const showUpdate = row.type !== "importable" &&
      canUpdateDevice(row as ConfiguredDevice) &&
      this._onlineStatus[row.configuration];

    return html`
      <div class="device-info">
        <div class="device-name-row">
          <span class="device-name">${row.friendly_name || row.name}</span>
          ${showUpdate
            ? html`<span
                class="update-badge"
                style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;background-color:#4caf50;color:white;cursor:pointer;text-transform:uppercase;display:inline-block;line-height:14px;vertical-align:middle;"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  openInstallChooseDialog(row.configuration);
                }}
              >Update</span>`
            : nothing}
        </div>
        ${row.comment
          ? html`<div class="device-description">${row.comment}</div>`
          : nothing}
      </div>
    `;
  }

  private _renderDeviceType(row: DataTableRowData): TemplateResult {
    if (row.type === "importable") {
      return html`<span class="device-type">—</span>`;
    }
    const platform = row.target_platform as SupportedPlatforms;
    const label = platform && supportedPlatforms[platform]
      ? supportedPlatforms[platform].label
      : platform || "—";
    return html`<span class="device-type">${label}</span>`;
  }

  private _renderAddress(row: DataTableRowData): TemplateResult {
    const address = row.ip_address || "-";
    const isStatic = row.has_static_ip === true;
    return html`
      <span class="address-cell">
        ${address}
        ${isStatic
          ? html`<ha-svg-icon
              class="lock-icon"
              .path=${mdiLock}
              title="Static IP"
              style="--mdc-icon-size: 10px; opacity: 0.25;"
            ></ha-svg-icon>`
          : nothing}
      </span>
    `;
  }

  private _renderFileName(row: DataTableRowData): TemplateResult {
    return html`
      <span class="filename editable-cell">
        ${row.configuration
          ? html`<code>${row.configuration}</code>`
          : html`<span class="no-config">—</span>`}
        ${row.configuration
          ? html`<ha-svg-icon
              class="edit-pencil"
              .path=${mdiPencil}
              title="Rename"
              style="--mdc-icon-size: 10px; opacity: 0.1; cursor: pointer;"
              @click=${(e: Event) => {
                e.stopPropagation();
                openRenameDialog(row.configuration, row.name);
              }}
              @mouseenter=${(e: Event) =>
                ((e.target as HTMLElement).style.opacity = "0.6")}
              @mouseleave=${(e: Event) =>
                ((e.target as HTMLElement).style.opacity = "0.1")}
            ></ha-svg-icon>`
          : nothing}
      </span>
    `;
  }

  private _renderStatus(row: DataTableRowData): TemplateResult {
    if (row.type === "importable") {
      return html`
        <span
          style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;text-transform:uppercase;background-color:#ff9800;color:white;display:inline-block;line-height:14px;vertical-align:middle;"
        >
          Discovered
        </span>
      `;
    }

    const isOnline = this._onlineStatus[row.configuration];
    return html`
      <span
        style="padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;text-transform:uppercase;background-color:${isOnline
          ? "#4caf50"
          : "#f44336"};color:white;display:inline-block;line-height:14px;vertical-align:middle;"
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

    return html`
      <div class="actions-container">
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
    return devices.map((device) => {
      const isImportable = this._isImportable(device);
      const configuredDevice = isImportable ? null : (device as ConfiguredDevice);
      const address = isImportable
        ? device.network || "-"
        : configuredDevice?.address || "-";
      // Static IP: address exists and is not an mDNS name (.local)
      const hasStaticIp = !isImportable &&
        configuredDevice?.address &&
        !configuredDevice.address.endsWith(".local") &&
        /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(configuredDevice.address);

      return {
        ...device,
        // Ensure we have an id field for the data table
        id: device.name,
        type: isImportable ? "importable" : "configured",
        // Add computed fields for sorting
        status: isImportable
          ? "Discovered"
          : this._onlineStatus[configuredDevice!.configuration]
            ? "Online"
            : "Offline",
        ip_address: address,
        has_static_ip: hasStaticIp,
        device_type: isImportable ? "-" : configuredDevice?.target_platform || "-",
        name: device.friendly_name || device.name,
      };
    });
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
    const columns = this._getTableColumns();

    // Build Group by menu
    const groupByMenu = html`
      <ha-md-button-menu positioning="popover">
        <ha-assist-chip
          .label=${`Group by${this._groupColumn && columns[this._groupColumn] ? ` ${columns[this._groupColumn].title}` : ""}`}
          slot="trigger"
        >
          <ha-svg-icon slot="trailing-icon" .path=${mdiMenuDown}></ha-svg-icon>
        </ha-assist-chip>
        ${Object.entries(columns).map(([id, column]) =>
          column.groupable
            ? html`
                <ha-md-menu-item
                  .value=${id}
                  @click=${this._handleGroupBy}
                  ?selected=${id === this._groupColumn}
                >
                  ${column.title}
                </ha-md-menu-item>
              `
            : nothing
        )}
        <ha-md-menu-item
          .value=${""}
          @click=${this._handleGroupBy}
          ?selected=${!this._groupColumn}
        >
          Don't group by
        </ha-md-menu-item>
      </ha-md-button-menu>
    `;

    // Build Sort by menu
    const sortByMenu = html`
      <ha-md-button-menu positioning="popover">
        <ha-assist-chip
          .label=${`Sort by${this._sortColumn && columns[this._sortColumn] ? ` ${columns[this._sortColumn].title}` : " Status"}`}
          slot="trigger"
        >
          <ha-svg-icon slot="trailing-icon" .path=${mdiMenuDown}></ha-svg-icon>
        </ha-assist-chip>
        ${Object.entries(columns).map(([id, column]) =>
          column.sortable
            ? html`
                <ha-md-menu-item
                  .value=${id}
                  @click=${this._handleSortBy}
                  ?selected=${id === this._sortColumn}
                >
                  ${this._sortColumn === id
                    ? html`
                        <ha-svg-icon
                          slot="end"
                          .path=${this._sortDirection === "desc" ? mdiArrowDown : mdiArrowUp}
                        ></ha-svg-icon>
                      `
                    : nothing}
                  ${column.title}
                </ha-md-menu-item>
              `
            : nothing
        )}
      </ha-md-button-menu>
    `;

    // Count active filters
    const activeFilters = this._filterStatus !== "all" ? 1 : 0;

    // Build Filter button
    const filterButton = html`
      <div class="relative">
        <ha-assist-chip
          .label=${"Filters"}
          .active=${this._showFilters || activeFilters > 0}
          @click=${this._toggleFilters}
        >
          <ha-svg-icon slot="icon" .path=${mdiFilterVariant}></ha-svg-icon>
        </ha-assist-chip>
        ${activeFilters > 0
          ? html`<div class="badge">${activeFilters}</div>`
          : nothing}
      </div>
    `;

    // Build Settings button (opens modal dialog)
    const settingsButton = html`
      <ha-assist-chip
        class="has-dropdown select-mode-chip"
        @click=${this._openSettings}
        title="Table settings"
      >
        <ha-svg-icon slot="icon" .path=${mdiTableCog}></ha-svg-icon>
      </ha-assist-chip>
    `;

    // Filter pane content
    const filterPane = html`
      <ha-expansion-panel outlined expanded>
        <div slot="header" class="filter-header">
          <ha-svg-icon .path=${mdiFilterVariant}></ha-svg-icon>
          Status
        </div>
        <div class="filter-content">
          <ha-filter-chip
            .selected=${this._filterStatus === "all"}
            @click=${() => this._setStatusFilter("all")}
          >
            All
          </ha-filter-chip>
          <ha-filter-chip
            .selected=${this._filterStatus === "online"}
            @click=${() => this._setStatusFilter("online")}
          >
            Online
          </ha-filter-chip>
          <ha-filter-chip
            .selected=${this._filterStatus === "offline"}
            @click=${() => this._setStatusFilter("offline")}
          >
            Offline
          </ha-filter-chip>
        </div>
      </ha-expansion-panel>
    `;

    return html`
      <div class="page-container ${this._showFilters ? "with-pane" : ""}">
        ${this._showFilters
          ? html`
              <div class="filter-pane">
                <div class="pane-header">
                  <ha-assist-chip
                    .label=${"Filters"}
                    active
                    @click=${this._toggleFilters}
                  >
                    <ha-svg-icon slot="icon" .path=${mdiFilterVariant}></ha-svg-icon>
                  </ha-assist-chip>
                  ${activeFilters > 0
                    ? html`
                        <ha-icon-button
                          .path=${mdiFilterVariantRemove}
                          @click=${this._clearFilters}
                          title="Clear filters"
                        ></ha-icon-button>
                      `
                    : nothing}
                </div>
                <div class="pane-content">
                  ${filterPane}
                </div>
              </div>
            `
          : nothing}
        <div class="table-container row-height-${this._rowHeight}">
          <div class="table-header">
            ${!this._showFilters ? filterButton : nothing}
            <search-input-outlined
              .hass=${mockHass}
              .filter=${this._filter}
              @value-changed=${this._handleSearchChange}
              .label=${`Search ${tableData.length} devices`}
              .placeholder=${`Search ${tableData.length} devices`}
            ></search-input-outlined>
            ${groupByMenu}
            ${sortByMenu}
            ${settingsButton}
          </div>
          <ha-data-table
            .hass=${mockHass}
            .columns=${columns}
            .data=${filteredData}
            .noDataText=${"No devices found"}
            .id=${"name"}
            .sortColumn=${this._sortColumn}
            .sortDirection=${this._sortDirection}
            .groupColumn=${this._groupColumn}
            .columnOrder=${this._columnOrder}
            .hiddenColumns=${this._hiddenColumns}
            clickable
            @row-click=${this._handleTableRowClick}
            @sorting-changed=${this._handleSortingChanged}
          ></ha-data-table>
        </div>
      </div>
      ${this._showSettingsDialog
        ? html`
            <ha-dialog
              open
              @closed=${this._closeSettingsDialog}
              heading="Customize"
            >
              <ha-dialog-header slot="heading">
                <ha-icon-button
                  slot="navigationIcon"
                  .path=${mdiClose}
                  @click=${this._closeSettingsDialog}
                  title="Close"
                ></ha-icon-button>
                <span slot="title">Customize</span>
              </ha-dialog-header>
              <div class="settings-content">
                <div class="settings-section">
                  <div class="settings-section-title">Row Height</div>
                  <div class="row-height-options">
                    <ha-filter-chip
                      .selected=${this._rowHeight === "compact"}
                      @click=${() => this._setRowHeight("compact")}
                    >
                      Compact
                    </ha-filter-chip>
                    <ha-filter-chip
                      .selected=${this._rowHeight === "default"}
                      @click=${() => this._setRowHeight("default")}
                    >
                      Default
                    </ha-filter-chip>
                    <ha-filter-chip
                      .selected=${this._rowHeight === "comfortable"}
                      @click=${() => this._setRowHeight("comfortable")}
                    >
                      Comfortable
                    </ha-filter-chip>
                  </div>
                </div>
                <div class="settings-section">
                  <div class="settings-section-title">Columns</div>
                  <ha-list>
                    ${Object.entries(columns).map(([id, column]) => {
                      if (!column.title || id === "actions") return nothing;
                      const isVisible = !this._hiddenColumns?.includes(id);
                      return html`
                        <ha-list-item
                          hasMeta
                          graphic="icon"
                          @click=${() => this._toggleColumnVisibility(id)}
                          class=${isVisible ? "" : "hidden-column"}
                        >
                          ${id !== "icon"
                            ? html`<ha-svg-icon
                                class="handle"
                                .path=${mdiDrag}
                                slot="graphic"
                              ></ha-svg-icon>`
                            : nothing}
                          ${column.title || id}
                          <ha-icon-button
                            class="action"
                            .path=${isVisible ? mdiEye : mdiEyeOff}
                            slot="meta"
                            title=${isVisible ? "Hide column" : "Show column"}
                          ></ha-icon-button>
                        </ha-list-item>
                      `;
                    })}
                  </ha-list>
                </div>
              </div>
              <ha-button
                slot="secondaryAction"
                @click=${this._resetColumnSettings}
              >
                Restore defaults
              </ha-button>
              <ha-button slot="primaryAction" @click=${this._closeSettingsDialog}>
                Done
              </ha-button>
            </ha-dialog>
          `
        : nothing}
    `;
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

  private _handleSearchChange(ev: CustomEvent): void {
    this._filter = ev.detail.value || "";
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

  private _handleShowDiscovered() {
    fireEvent(this, "toggle-discovered-devices");
  }

  private _handleViewModeChange = () => {
    this.requestUpdate();
  };

  private _handleSortChange = () => {
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
      /* Set divider color for data table row borders */
      --divider-color: rgba(0, 0, 0, 0.12);
    }

    .page-container {
      display: flex;
      height: 100%;
    }

    .page-container.with-pane .table-container {
      flex: 1;
    }

    .filter-pane {
      width: 250px;
      min-width: 250px;
      border-right: 1px solid var(--divider-color);
      background: var(--primary-background-color);
      display: flex;
      flex-direction: column;
    }

    .pane-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      height: 56px;
      border-bottom: 1px solid var(--divider-color);
      background: var(--primary-background-color);
    }

    .pane-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .filter-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-header ha-svg-icon {
      color: var(--primary-color);
    }

    .filter-content {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 0;
    }

    ha-expansion-panel {
      --expansion-panel-summary-padding: 0 8px;
      --expansion-panel-content-padding: 0 8px;
    }

    /* Settings dialog styles */
    ha-dialog {
      --mdc-dialog-min-width: 400px;
      --mdc-dialog-max-width: 400px;
      --dialog-content-padding: 0 8px;
      --dialog-z-index: 20;
    }

    .settings-content {
      min-height: 200px;
    }

    .settings-content ha-list-item {
      --mdc-list-side-padding: 12px;
      overflow: visible;
      cursor: pointer;
    }

    .settings-content ha-list-item.hidden-column {
      color: var(--disabled-text-color);
    }

    .settings-content .handle {
      cursor: grab;
    }

    .settings-content ha-icon-button {
      display: block;
      margin: -12px;
    }

    .table-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      position: relative;
      flex: 1;
      z-index: 0;
    }

    .table-header {
      display: flex;
      align-items: center;
      --mdc-shape-small: 0;
      height: 56px;
      width: 100%;
      justify-content: space-between;
      padding: 0 16px;
      gap: 16px;
      box-sizing: border-box;
      background: var(--primary-background-color);
      border-bottom: 1px solid var(--divider-color);
    }

    .table-header search-input-outlined {
      flex: 1;
    }

    ha-assist-chip {
      --ha-assist-chip-container-shape: 10px;
      --ha-assist-chip-container-color: var(--card-background-color);
    }

    ha-md-button-menu ha-assist-chip {
      --md-assist-chip-trailing-space: 8px;
    }

    .relative {
      position: relative;
    }

    .badge {
      position: absolute;
      top: -4px;
      right: -4px;
      inset-inline-end: -4px;
      inset-inline-start: initial;
      min-width: 16px;
      box-sizing: border-box;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 400;
      background-color: var(--primary-color);
      line-height: 16px;
      text-align: center;
      padding: 0px 2px;
      color: var(--text-primary-color);
    }

    .select-mode-chip {
      --md-assist-chip-icon-label-space: 0;
      --md-assist-chip-trailing-space: 8px;
    }

    ha-data-table {
      flex: 1;
      width: 100%;
      --data-table-row-height: 60px;
      --data-table-border-width: 0;
    }

    /* Row height variants */
    .row-height-compact ha-data-table {
      --data-table-row-height: 44px;
    }
    .row-height-default ha-data-table {
      --data-table-row-height: 60px;
    }
    .row-height-comfortable ha-data-table {
      --data-table-row-height: 76px;
    }

    /* Editable cell styles */
    .editable-cell {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .editable-cell ha-svg-icon.edit-pencil {
      --mdc-icon-size: 10px;
      width: 10px;
      height: 10px;
      min-width: 10px;
      min-height: 10px;
      color: var(--secondary-text-color);
      opacity: 0.1;
      cursor: pointer;
      transition: opacity 0.15s ease, color 0.15s ease;
      flex-shrink: 0;
    }

    .editable-cell ha-svg-icon.edit-pencil:hover {
      opacity: 0.6;
      color: var(--primary-color);
    }

    /* Address cell with lock icon */
    .address-cell {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .address-cell ha-svg-icon.lock-icon {
      --mdc-icon-size: 10px;
      width: 10px;
      height: 10px;
      min-width: 10px;
      min-height: 10px;
      color: var(--secondary-text-color);
      opacity: 0.25;
      flex-shrink: 0;
    }

    /* Smaller buttons with tighter padding */
    mwc-button {
      --mdc-typography-button-font-size: 12px;
      --mdc-button-horizontal-padding: 4px;
      --mdc-shape-small: 4px;
    }

    /* Device type badge */
    .device-type {
      font-size: 12px;
      color: var(--primary-text-color);
    }

    .device-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .device-name-row {
      display: flex;
      align-items: center;
      gap: 8px;
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
