import { animate } from "@lit-labs/motion";
import { LitElement, html, css } from "lit";
import { customElement, query, state } from "lit/decorators.js";
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

@customElement("esphome-devices-list")
class ESPHomeDevicesList extends LitElement {
  @state() private _configured?: Map<string, ConfiguredDevice>;
  @state() private _importable?: Map<string, ImportableDevice>;
  @state() private _onlineStatus?: Record<string, boolean>;

  @query("esphome-search") private _search!: ESPHomeSearch;

  private _devicesUnsub?: ReturnType<typeof subscribeDevices>;
  private _onlineStatusUnsub?: ReturnType<typeof subscribeOnlineStatus>;
  private _metadataRefresher = new MetadataRefresher();
  private _new = new Set<string>();

  protected render() {
    if (this._configured?.size === 0 && this._importable?.size === 0) {
      return html`
        <div class="welcome-container">
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

    return html`
      <esphome-search></esphome-search>
      <div class="grid">
        ${repeat(
          Array.from(this._importable?.values() || []).filter((item) =>
            this._filter(item)
          ),
          (device) => device.name,
          (device) => html`
            <esphome-importable-device-card
              .device=${device}
              @adopted=${this._updateDevices}
            ></esphome-importable-device-card>
          `
        )}
        ${repeat(
          Array.from(this._configured?.values() || []).filter((item) =>
            this._filter(item)
          ),
          (device) => device.name,
          (device) => html`<esphome-configured-device-card
            ${animate({
              id: device.name,
              inId: device.name,
              skipInitial: true,
            })}
            data-name=${device.name}
            .device=${device}
            .onlineStatus=${(this._onlineStatus || {})[device.configuration]}
            .highlightOnAdd=${this._new.has(device.name)}
            @deleted=${this._updateDevices}
          ></esphome-configured-device-card>`
        )}
      </div>
    `;
  }

  private _filter(item: ImportableDevice | ConfiguredDevice): boolean {
    if (this._search?.value) {
      if (item.name!.indexOf(this._search.value) >= 0) {
        return true;
      }
      if (
        "friendly_name" in item &&
        item.friendly_name &&
        item.friendly_name!.indexOf(this._search.value) >= 0
      ) {
        return true;
      }
      if (
        "comment" in item &&
        item.comment &&
        item.comment!.indexOf(this._search.value) >= 0
      ) {
        return true;
      }
      return false;
    }
    return true;
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
    .welcome-container {
      text-align: center;
      margin-top: 40px;
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
  `;

  private async _updateDevices() {
    await this._devicesUnsub!.refresh();
  }

  private _scrollToDevice(name: string) {
    const elem = this.renderRoot!.querySelector(
      `esphome-configured-device-card[data-name='${name}']`
    ) as HTMLElementTagNameMap["esphome-configured-device-card"];
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  }

  public connectedCallback() {
    super.connectedCallback();

    this._devicesUnsub = subscribeDevices(async (devices) => {
      if (!devices) return;
      let newName: string | undefined;

      // don't replace the list and apply status to existing devices so they dont appear as new after clearing the search...
      let configured = new Map<string, ConfiguredDevice>();
      if (this._configured) {
        configured = this._configured;
      }
      if (devices.configured) {
        // remove deleted items 1st
        if (this._configured) {
          const toRemove: string[] = [];
          this._configured.forEach((device: ConfiguredDevice) => {
            if (
              devices.configured.filter((d) => d.name === device.name)
                .length === 0
            ) {
              toRemove.push(device.name);
            }
          });
          toRemove.forEach((n) => this._configured?.delete(n));
        }
        // update / add items
        devices.configured.forEach((d) => {
          if (!configured.has(d.name)) {
            if (this._configured) {
              // not the 1st time, so this is a new device
              this._new.add(d.name);
              newName = d.name;
            }
          }
          configured.set(d.name, d);
        });
        if (!this._configured) {
          this._configured = configured;
        }
      }

      if (newName) {
        await this.updateComplete;
        this._scrollToDevice(newName);
      }

      let importable = new Map<string, ImportableDevice>();
      if (this._importable) {
        importable = this._importable;
      }
      if (devices.importable) {
        // remove deleted items 1st
        if (this._importable) {
          const toRemove: string[] = [];
          this._importable.forEach((device: ImportableDevice) => {
            if (
              devices.configured.filter((d) => d.name === device.name)
                .length === 0
            ) {
              toRemove.push(device.name);
            }
          });
          toRemove.forEach((n) => this._configured?.delete(n));
        }
        // update / add items
        devices.importable.forEach((d) => {
          importable.set(d.name, d);
        });
        if (!this._importable) {
          this._importable = importable;
        }
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
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-devices-list": ESPHomeDevicesList;
  }
}
