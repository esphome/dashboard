import { animate } from "@lit-labs/motion";
import { LitElement, html, css, nothing } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import {
  subscribeDevices,
  ImportableDevice,
  ConfiguredDevice,
} from "../api/devices";
import { openWizardDialog } from "../wizard";
import "@material/mwc-button";
import "@material/mwc-textfield";
import { subscribeOnlineStatus } from "../api/online-status";
import "./configured-device-card";
import "./importable-device-card";
import "../components/esphome-search";
import { MetadataRefresher } from "./device-metadata-refresher";
import { ESPHomeSearch } from "../components/esphome-search";
import { fireEvent } from "../util/fire-event";
import { openValidateDialog } from "../validate";
import { openLogsTargetDialog } from "../logs-target";
import { openInstallChooseDialog } from "../install-choose";
import { openDeleteDeviceDialog } from "../delete-device";
import { openEditDialog } from "../editor";
import { openUpdateAllDialog } from "../update-all";

@customElement("esphome-devices-list")
class ESPHomeDevicesList extends LitElement {
  @property() public showDiscoveredDevices = false;

  @state() private _devices?: Array<ImportableDevice | ConfiguredDevice>;
  @state() private _onlineStatus: Record<string, boolean> = {};
  @state() private _viewMode: 'cards' | 'table' = 'cards';
  @state() private _sortBy: 'name' | 'ip' | 'status' = 'name';
  @state() private _filterStatus: 'all' | 'online' | 'offline' = 'all';

  @query("esphome-search") private _search!: ESPHomeSearch;

  private _devicesUnsub?: ReturnType<typeof subscribeDevices>;
  private _onlineStatusUnsub?: ReturnType<typeof subscribeOnlineStatus>;
  private _metadataRefresher = new MetadataRefresher();
  private _new = new Set<string>();

  private _isImportable = (item: any): item is ImportableDevice => {
    return "package_import_url" in item;
  };

  private _handleViewModeChange = (e: CustomEvent) => {
    this._viewMode = e.detail.viewMode;
  };

  private _handleSortChange = (e: CustomEvent) => {
    this._sortBy = e.detail.sortBy;
  };

  private _handleFilterChange = (e: CustomEvent) => {
    this._filterStatus = e.detail.filterStatus;
  };

  private _sortDevices(devices: Array<ImportableDevice | ConfiguredDevice>): Array<ImportableDevice | ConfiguredDevice> {
    const importable = devices.filter(d => this._isImportable(d));
    const configured = devices.filter(d => !this._isImportable(d));

    // Sort importable devices
    importable.sort((a, b) => {
      if ((a as ImportableDevice).ignored !== (b as ImportableDevice).ignored) {
        return Number((a as ImportableDevice).ignored) - Number((b as ImportableDevice).ignored);
      }
      return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase());
    });

    // Sort configured devices based on _sortBy
    configured.sort((a, b) => {
      const aConfig = a as ConfiguredDevice;
      const bConfig = b as ConfiguredDevice;

      switch (this._sortBy) {
        case 'ip':
          const aIp = aConfig.address || '';
          const bIp = bConfig.address || '';
          return aIp.localeCompare(bIp);
        case 'status':
          const aOnline = this._onlineStatus[aConfig.configuration] ? 1 : 0;
          const bOnline = this._onlineStatus[bConfig.configuration] ? 1 : 0;
          if (aOnline !== bOnline) {
            return bOnline - aOnline; // Online first
          }
          // Fall through to name sorting
        case 'name':
        default:
          const aName = aConfig.friendly_name || aConfig.name;
          const bName = bConfig.friendly_name || bConfig.name;
          return aName.toLocaleLowerCase().localeCompare(bName.toLocaleLowerCase());
      }
    });

    return [...importable, ...configured];
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

    const sorted = this._sortDevices([...this._devices]);
    const filtered: Array<ImportableDevice | ConfiguredDevice> =
      sorted.filter((item) => this._filter(item));
    const discoveredCount = this._devices.filter(
      (item) => this._isImportable(item) && !item.ignored,
    ).length;

    let htmlClass = "no-result-container";
    let htmlDevices = html`
      <h5>No devices found</h5>
      <p>Adjust your search criteria.</p>
    `;
    if ((filtered?.length ? filtered?.length : 0) > 0) {
      if (this._viewMode === 'cards') {
        htmlClass = "grid";
        htmlDevices = html`${repeat(
          filtered!,
          (device) => device.name,
          (device) => html`
            ${this._isImportable(device)
              ? html`<esphome-importable-device-card
                  .device=${device}
                  @device-updated=${this._updateDevices}
                ></esphome-importable-device-card>`
              : html`<esphome-configured-device-card
                  ${animate({
                    id: device.name,
                    inId: device.name,
                    skipInitial: true,
                    disabled: !this._new.has(device.name),
                  })}
                  data-name=${device.name}
                  .device=${device}
                  .onlineStatus=${(this._onlineStatus || {})[
                    device.configuration
                  ]}
                  .highlightOnAdd=${this._new.has(device.name)}
                  @deleted=${this._updateDevices}
                ></esphome-configured-device-card>`}
          `,
        )}`;
      } else {
        htmlClass = "table-container";
        htmlDevices = this._renderTable(filtered);
      }
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

  private _renderTable(devices: Array<ImportableDevice | ConfiguredDevice>) {
    return html`
      <table class="devices-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>IP Address</th>
            <th>mDNS</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${devices.map(device => {
            if (this._isImportable(device)) {
              const importableDevice = device as ImportableDevice;
              return html`
                <tr class="importable-row${importableDevice.ignored ? ' ignored' : ''}">
                  <td>${importableDevice.friendly_name || importableDevice.name}</td>
                  <td><span class="status-badge discovered">Discovered</span></td>
                  <td>${importableDevice.network?.ip_address || '-'}</td>
                  <td>${importableDevice.network?.hostname || '-'}</td>
                  <td class="actions">
                    <mwc-button
                      @click=${() => openWizardDialog({ device: importableDevice })}
                      label="Adopt"
                    ></mwc-button>
                  </td>
                </tr>
              `;
            } else {
              const configuredDevice = device as ConfiguredDevice;
              const isOnline = this._onlineStatus[configuredDevice.configuration];
              const canUpdate = canUpdateDevice(configuredDevice);
              return html`
                <tr>
                  <td>${configuredDevice.friendly_name || configuredDevice.name}</td>
                  <td>
                    <span class="status-badge ${isOnline ? 'online' : 'offline'}">
                      ${isOnline ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td>${configuredDevice.address || '-'}</td>
                  <td>${configuredDevice.web_server_port ? `${configuredDevice.name}.local:${configuredDevice.web_server_port}` : '-'}</td>
                  <td class="actions">
                    ${canUpdate && isOnline
                      ? html`
                          <mwc-button
                            @click=${() => openUpdateAllDialog([configuredDevice.configuration])}
                            label="Update"
                          ></mwc-button>
                        `
                      : nothing}
                    ${configuredDevice.web_server_port && isOnline
                      ? html`
                          <mwc-button
                            @click=${() => {
                              const url = `http://${configuredDevice.address}:${configuredDevice.web_server_port}`;
                              window.open(url, "_blank");
                            }}
                            label="Visit"
                          ></mwc-button>
                        `
                      : nothing}
                    <mwc-button
                      @click=${() => openEditDialog(configuredDevice.configuration)}
                      label="Edit"
                    ></mwc-button>
                    <mwc-button
                      @click=${() => openLogsTargetDialog(configuredDevice)}
                      label="Logs"
                    ></mwc-button>
                    <mwc-button
                      @click=${() => openValidateDialog(configuredDevice.configuration)}
                      label="Validate"
                    ></mwc-button>
                    <mwc-button
                      @click=${() => openDeleteDeviceDialog(configuredDevice)}
                      label="Delete"
                    ></mwc-button>
                  </td>
                </tr>
              `;
            }
          })}
        </tbody>
      </table>
    `;
  }

  private _filter(item: ImportableDevice | ConfiguredDevice): boolean {
    if (!this.showDiscoveredDevices && this._isImportable(item)) {
      return false;
    }

    // Apply status filter
    if (this._filterStatus !== 'all' && !this._isImportable(item)) {
      const isOnline = this._onlineStatus[(item as ConfiguredDevice).configuration];
      if (this._filterStatus === 'online' && !isOnline) {
        return false;
      }
      if (this._filterStatus === 'offline' && isOnline) {
        return false;
      }
    }

    if (this._search?.value) {
      const searchValue = this._search!.value.toLowerCase();
      if (item.name!.toLowerCase().indexOf(searchValue) >= 0) {
        return true;
      }
      if (
        "friendly_name" in item &&
        item.friendly_name &&
        item.friendly_name!.toLowerCase().indexOf(searchValue) >= 0
      ) {
        return true;
      }
      if (
        "comment" in item &&
        item.comment &&
        item.comment!.toLowerCase().indexOf(searchValue) >= 0
      ) {
        return true;
      }
      if (
        "project_name" in item &&
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
      grid-template-columns: 1fr;
      grid-template-columns: 1fr 1fr 1fr;
      grid-column-gap: 1.5rem;
      margin: 20px auto;
      width: 90%;
      max-width: 1920px;
      justify-content: stretch;
    }
    @media only screen and (max-width: 1100px) {
      .grid {
        grid-template-columns: 1fr 1fr;
        grid-column-gap: 1.5rem;
      }
    }
    @media only screen and (max-width: 750px) {
      .grid {
        grid-template-columns: 1fr;
        grid-column-gap: 0;
      }
      .container {
        width: 100%;
      }
    }
    esphome-configured-device-card,
    esphome-importable-device-card {
      margin: 0.5rem 0 1rem 0;
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
    hr {
      margin-top: 16px;
      margin-bottom: 16px;
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
      overflow-x: auto;
    }
    .devices-table {
      width: 100%;
      border-collapse: collapse;
      background-color: var(--primary-background-color);
      box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14),
                  0 1px 5px 0 rgba(0,0,0,0.12),
                  0 3px 1px -2px rgba(0,0,0,0.2);
    }
    .devices-table th {
      text-align: left;
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
      font-weight: 500;
      color: var(--primary-text-color);
    }
    .devices-table td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--divider-color);
      color: var(--primary-text-color);
    }
    .devices-table tbody tr:hover {
      background-color: var(--secondary-background-color);
    }
    .devices-table .importable-row {
      background-color: var(--info-color-bg, rgba(33, 150, 243, 0.1));
    }
    .devices-table .importable-row.ignored {
      opacity: 0.6;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
    }
    .status-badge.online {
      background-color: var(--success-color-bg, rgba(76, 175, 80, 0.2));
      color: var(--success-color, #4caf50);
    }
    .status-badge.offline {
      background-color: var(--error-color-bg, rgba(244, 67, 54, 0.2));
      color: var(--error-color, #f44336);
    }
    .status-badge.discovered {
      background-color: var(--info-color-bg, rgba(33, 150, 243, 0.2));
      color: var(--info-color, #2196f3);
    }
    .actions {
      white-space: nowrap;
    }
    .actions mwc-button {
      --mdc-theme-primary: var(--primary-color);
      --mdc-button-horizontal-padding: 8px;
      margin: 0 2px;
    }
    @media only screen and (max-width: 750px) {
      .devices-table {
        font-size: 14px;
      }
      .devices-table th,
      .devices-table td {
        padding: 8px;
      }
      .actions mwc-button {
        --mdc-button-horizontal-padding: 4px;
        font-size: 12px;
      }
    }
  `;

  private async _updateDevices() {
    await this._devicesUnsub!.refresh();
  }

  private _scrollToDevice(name: string) {
    const elem = this.renderRoot!.querySelector(
      `esphome-configured-device-card[data-name='${name}']`,
    ) as HTMLElementTagNameMap["esphome-configured-device-card"];
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  }

  public connectedCallback() {
    super.connectedCallback();

    // Add event listeners for view mode, sort, and filter changes
    document.addEventListener('view-mode-changed', this._handleViewModeChange);
    document.addEventListener('sort-changed', this._handleSortChange);
    document.addEventListener('filter-changed', this._handleFilterChange);

    this._devicesUnsub = subscribeDevices(async (devices) => {
      if (!devices) return;
      let newName: string | undefined;

      const newDevices = new Set<string>();
      let newList: Array<ImportableDevice | ConfiguredDevice> = [];

      if (devices.configured) {
        devices.configured.forEach((d) => {
          if (
            this._devices &&
            this._devices.filter((old) => old.name === d.name).length === 0
          ) {
            newDevices.add(d.name);
            newName = d.name;
          }
          newList.push(d);
        });
      }

      // Don't sort here - sorting will be done in render based on _sortBy
      if (devices.importable) {
        newList = [...devices.importable, ...newList];
      }

      this._devices = newList;
      this._new = newDevices;

      if (newName) {
        await this.updateComplete;
        this._scrollToDevice(newName);
      }

      // check if any YAML has been copied in and needs to
      // have it's metadata generated
      for (const device of devices.configured) {
        if (device.loaded_integrations?.length === 0) {
          this._metadataRefresher.add(device.configuration);
        }
      }
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
    // Remove event listeners
    document.removeEventListener('view-mode-changed', this._handleViewModeChange);
    document.removeEventListener('sort-changed', this._handleSortChange);
    document.removeEventListener('filter-changed', this._handleFilterChange);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-devices-list": ESPHomeDevicesList;
  }
}
