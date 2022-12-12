import { animate } from "@lit-labs/motion";
import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { subscribeDevices, ListDevicesResult } from "../api/devices";
import { openWizardDialog } from "../wizard";
import "@material/mwc-button";
import { subscribeOnlineStatus } from "../api/online-status";
import "./configured-device-card";
import "./importable-device-card";
import { MetadataRefresher } from "./device-metadata-refresher";

@customElement("esphome-devices-list")
class ESPHomeDevicesList extends LitElement {
  @state() private _devices?: ListDevicesResult;
  @state() private _onlineStatus?: Record<string, boolean>;

  private _devicesUnsub?: ReturnType<typeof subscribeDevices>;
  private _onlineStatusUnsub?: ReturnType<typeof subscribeOnlineStatus>;
  private _highlightOnAdd = false;
  private _metadataRefresher = new MetadataRefresher();

  protected render() {
    if (this._devices === undefined) {
      return html``;
    }
    if (
      this._devices.configured.length === 0 &&
      this._devices.importable.length === 0
    ) {
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

    const importable = this._devices.importable;

    return html`
      <div class="grid">
        ${importable.length
          ? html`
              ${repeat(
                importable,
                (device) => device.name,
                (device) => html`
                  <esphome-importable-device-card
                    ${animate({ id: device.name, skipInitial: true })}
                    .device=${device}
                    @adopted=${this._updateDevices}
                    .highlightOnAdd=${this._highlightOnAdd}
                  ></esphome-importable-device-card>
                `
              )}
            `
          : ""}
        ${repeat(
          this._devices.configured,
          (device) => device.name,
          (device) =>
            device.configuration.includes(".hide.")
              ? html``
              : html`<esphome-configured-device-card
                  ${animate({
                    id: device.name,
                    inId: device.name,
                    skipInitial: true,
                  })}
                  .device=${device}
                  @deleted=${this._updateDevices}
                  .onlineStatus=${(this._onlineStatus || {})[
                    device.configuration
                  ]}
                  data-name=${device.name}
                  .highlightOnAdd=${this._highlightOnAdd}
                ></esphome-configured-device-card>`
        )}
      </div>
    `;
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
    mwc-button {
      --mdc-theme-primary: #4caf50;
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
      let newName: string | undefined;

      if (this._devices !== undefined) {
        this._highlightOnAdd = true;
        const oldNames = new Set(this._devices.configured.map((d) => d.name));

        for (const device of devices.configured) {
          if (!oldNames.has(device.name)) {
            newName = device.name;
            break;
          }
        }
      }
      this._devices = devices;

      if (newName) {
        await this.updateComplete;
        this._scrollToDevice(newName);
      }

      // check if any YAML has been copied in and needs to
      // have it's metadata generated
      for (const device of devices.configured) {
        if (device.loaded_integrations.length === 0) {
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
