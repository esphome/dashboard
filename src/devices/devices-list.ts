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
import "@material/mwc-icon";
import "@material/mwc-textfield";
import "@material/mwc-linear-progress";
import { subscribeOnlineStatus } from "../api/online-status";
import "./configured-device-card";
import "./importable-device-card";
import "../components/esphome-search";
import { MetadataRefresher } from "./device-metadata-refresher";
import { ESPHomeSearch } from "../components/esphome-search";

@customElement("esphome-devices-list")
class ESPHomeDevicesList extends LitElement {
  @state() private _devices?: Array<ImportableDevice | ConfiguredDevice>;
  @state() private _onlineStatus: Record<string, boolean> = {};

  @query("esphome-search") private _search!: ESPHomeSearch;

  private _devicesUnsub?: ReturnType<typeof subscribeDevices>;
  private _onlineStatusUnsub?: ReturnType<typeof subscribeOnlineStatus>;
  private _metadataRefresher = new MetadataRefresher();
  private _new = new Set<string>();

  private _isImportable = (item: any): item is ImportableDevice => {
    return "package_import_url" in item;
  };

  protected render() {
    const emptySvg = html`
      <svg
        fill="currentColor"
        viewBox="0 0 24 24"
        class="empty-icon"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.253 2.755c-.676 0-1.231.555-1.231 1.232v.976h-.083a.722.722 0 0 0-.717.716v11.682H.71v-.57h3.544a.355.355 0 0 0 .354-.354v-1.279a.355.355 0 0 0-.354-.355H.709v-.565h3.544a.355.355 0 0 0 .354-.355v-1.278a.355.355 0 0 0-.354-.355H.709v-.569h3.544a.355.355 0 0 0 .354-.355V10.05a.355.355 0 0 0-.354-.354H.709V6.113a.355.355 0 0 0-.355-.355.355.355 0 0 0-.354.355v3.937a.355.355 0 0 0 .354.355h3.544v.566H.354a.355.355 0 0 0-.354.355v1.279a.355.355 0 0 0 .354.354h3.544v.57H.354a.355.355 0 0 0-.354.354v1.275a.355.355 0 0 0 .354.355h3.544v.57H.354a.355.355 0 0 0-.354.354v1.278a.355.355 0 0 0 .354.355h4.868v.086c0 .389.323.716.717.716h.083v1.14c0 .677.555 1.233 1.231 1.233.677 0 1.233-.556 1.233-1.232v-1.14h.477v1.137c0 .676.556 1.232 1.232 1.232.677 0 1.232-.556 1.232-1.232v-1.138h.481v1.138c0 .676.556 1.232 1.232 1.232.676 0 1.233-.556 1.233-1.232v-1.138h.48v1.138c0 .676.556 1.232 1.232 1.232.677 0 1.232-.556 1.232-1.232v-1.138h.481v1.138c0 .676.556 1.232 1.232 1.232.676 0 1.233-.556 1.233-1.232v-1.138h.477v1.138c0 .676.555 1.232 1.231 1.232.677 0 1.233-.556 1.233-1.232v-1.138h.079c.39 0 .717-.323.717-.716V5.679a.723.723 0 0 0-.714-.716h-.082v-.979c0-.676-.556-1.231-1.232-1.23h-.001a1.238 1.238 0 0 0-1.231 1.233v.976h-.477v-.98c0-.675-.557-1.23-1.233-1.228h-.001c-.676 0-1.23.556-1.23 1.232v.976h-.482v-.976c0-.677-.555-1.232-1.232-1.232-.676 0-1.232.555-1.232 1.232v.976h-.48v-.976c0-.677-.557-1.232-1.233-1.232s-1.232.555-1.232 1.232v.976h-.48v-.976c0-.677-.556-1.232-1.233-1.232-.676 0-1.232.555-1.232 1.232v.976h-.477v-.976c0-.677-.556-1.232-1.233-1.232zm0 .715a.51.51 0 0 1 .517.517v.976H6.737v-.976a.51.51 0 0 1 .516-.517zm2.942 0a.51.51 0 0 1 .517.517v.976H9.679v-.976a.51.51 0 0 1 .516-.517zm2.945 0a.51.51 0 0 1 .516.517v.976h-1.032v-.976a.51.51 0 0 1 .516-.517zm2.945 0a.51.51 0 0 1 .517.517v.976h-1.033v-.976a.51.51 0 0 1 .516-.517zm2.945 0h.001a.507.507 0 0 1 .515.513v.98h-1.032v-.976a.51.51 0 0 1 .516-.517zm2.942.001h.001a.507.507 0 0 1 .515.513v.979h-1.032v-.976a.51.51 0 0 1 .516-.516zM6.018 5.758h17.186v12.319H6.018zm8.63 2.777a.322.322 0 0 0-.234.095l-3.776 3.78a.322.322 0 0 0 .228.55h.62v2.225a.322.322 0 0 0 .323.322h5.67a.322.322 0 0 0 .322-.322V12.96h.621a.322.322 0 0 0 .228-.55l-.856-.859v-1.533a.322.322 0 0 0-.322-.323h-.591a.322.322 0 0 0-.323.323v.3L14.87 8.63a.322.322 0 0 0-.221-.095zm-7.91 10.337H7.77v1.14a.51.51 0 0 1-.517.517.51.51 0 0 1-.516-.516zm2.94 0h1.034v1.138a.51.51 0 0 1-.517.516.51.51 0 0 1-.516-.516zm2.946 0h1.032v1.138a.51.51 0 0 1-.516.516.51.51 0 0 1-.516-.516zm2.945 0h1.033v1.138a.51.51 0 0 1-.517.516.51.51 0 0 1-.516-.516zm2.945 0h1.032v1.138a.51.51 0 0 1-.516.516.51.51 0 0 1-.516-.516zm2.941 0h1.033v1.138a.51.51 0 0 1-.517.516.51.51 0 0 1-.516-.516z"
        />
      </svg>
    `;
    if (this._devices?.length === 0) {
      return html`
        <section class="no-result-container">
          ${emptySvg}
          <h5>Welcome to ESPHome</h5>
          <p class="helper-text">
            It looks like you don't have any devices yet.
          </p>
          <mwc-button
            raised
            label="New device"
            icon="add"
            @click=${this._handleOpenWizardClick}
          ></mwc-button>
        </section>
      `;
    }

    // catch when 1st load there is no data yet, and we don't want to show no devices message
    if (!this._devices) {
      return html` <div class="loading-container">
        <div class="grid">
          <esphome-importable-device-card
            skeleton
          ></esphome-importable-device-card>
        </div>
      </div>`;
    }

    const filtered: Array<ImportableDevice | ConfiguredDevice> =
      this._devices!.filter((item) => this._filter(item));
    if (filtered?.length === 0) {
      return html`
        <div class="no-result-container">
          ${emptySvg}
          <h5>No devices found</h5>
          <p class="helper-text">
            Please try entering a different search term or
            <a href="#" @click=${this._handleOpenWizardClick}
              >add a new device</a
            >.
          </p>
        </div>
      `;
    }

    const htmlDevices = html`${repeat(
      filtered!,
      (device) => device.name,
      (device) => html`
        ${this._isImportable(device)
          ? html`<esphome-importable-device-card
              .device=${device}
              @adopted=${this._updateDevices}
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
              .onlineStatus=${(this._onlineStatus || {})[device.configuration]}
              .highlightOnAdd=${this._new.has(device.name)}
              @deleted=${this._updateDevices}
            ></esphome-configured-device-card>`}
      `
    )}`;

    return html`
      <div class="page-container">
        <esphome-search @input=${() => this.requestUpdate()}></esphome-search>
        <div class="grid">${htmlDevices}</div>
      </div>
    `;
  }

  private _filter(item: ImportableDevice | ConfiguredDevice): boolean {
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

  private _handleOpenWizardClick() {
    openWizardDialog();
  }

  static styles = css`
    .page-container {
      display: flex;
      flex-direction: column;
      width: 90%;
      margin: 20px auto;
      align-items: stretch;
      max-width: 1920px;
      gap: 20px;
    }

    .grid {
      width: 100%;
      display: grid;
      grid-template-columns: 1fr;
      grid-template-columns: 1fr 1fr 1fr;
      grid-column-gap: 1.5rem;
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

    .no-result-container h5 {
      font-size: 1.64rem;
      line-height: 110%;
      font-weight: 400;
      margin: 1rem 0 0.65rem 0;
    }
    .no-result-container .helper-text {
      color: var(--secondary-text-color);
    }
    .no-result-container .empty-icon {
      width: 100px;
      color: var(--disabled-text-color);
    }

    .no-result-container a {
      color: var(--mdc-theme-primary);
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

      const newDevices = new Set<string>();
      const newList: Array<ImportableDevice | ConfiguredDevice> = [];

      if (devices.importable) {
        devices.importable.forEach((d) => newList.push(d));
      }

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
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-devices-list": ESPHomeDevicesList;
  }
}
