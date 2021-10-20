import { LitElement, html, css, TemplateResult, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import { canUpdateDevice, ConfiguredDevice } from "../api/devices";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-button";
import "@material/mwc-icon-button";
import "../components/esphome-button-menu";
import "../components/esphome-card";
import "./delete-device-dialog";
import "@polymer/paper-tooltip/paper-tooltip.js";
import { openCleanMQTTDialog } from "../clean-mqtt";
import { openCleanDialog } from "../clean";
import { openValidateDialog } from "../validate";
import { openEditDialog } from "../legacy";
import { openInstallDialog } from "../install-update";
import { openLogsTargetDialog } from "../logs-target";
import { fireEvent } from "../util/fire-event";

const UPDATE_TO_ICON = "➡️";
const STATUS_COLORS = {
  NEW: "rgb(255, 165, 0)",
  OFFLINE: "var(--alert-error-color)",
  "UPDATE AVAILABLE": "var(--update-available-color)",
};

@customElement("esphome-configured-device-card")
class ESPHomeConfiguredDeviceCard extends LitElement {
  @property() public device!: ConfiguredDevice;
  @property() public onlineStatus = false;
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
    const content: TemplateResult[] = [];

    if (
      this.device.configuration !== `${this.device.name}.yaml` &&
      this.device.configuration !== `${this.device.name}.yml`
    ) {
      content.push(html`
        <div class="device-config-path tooltip-container">
          <code class="inlinecode">${this.device.configuration}</code>
          <paper-tooltip>
            Full Path:
            <code class="inlinecode">${this.device.path}</code>
          </paper-tooltip>
        </div>
      `);
    }
    if (this.device.comment) {
      content.push(html`<div>${this.device.comment}</div>`);
    }

    const updateAvailable = canUpdateDevice(this.device);
    const status = this._highlight
      ? "NEW"
      : this.onlineStatus === false
      ? "OFFLINE"
      : updateAvailable
      ? "UPDATE AVAILABLE"
      : undefined;
    return html`
      <esphome-card
        .status=${status}
        style=${styleMap({
          "--status-color": status === undefined ? "" : STATUS_COLORS[status],
        })}
      >
        <div class="card-header">${this.device.name}</div>

        ${content.length
          ? html`<div class="card-content flex">${content}</div>`
          : html`<div class="flex"></div>`}

        <div class="card-actions">
          ${updateAvailable
            ? html`
                <div class="tooltip-container">
                  <mwc-button
                    @click=${this._handleInstall}
                    class="update-available"
                    icon="system_update"
                    label="Update"
                  ></mwc-button>
                  <paper-tooltip>
                    Update Available: ${this.device.deployed_version}
                    ${UPDATE_TO_ICON} ${this.device.current_version}
                  </paper-tooltip>
                </div>
              `
            : ""}
          ${this.device.loaded_integrations.includes("web_server")
            ? html`
                <a href=${`http://${this.device.address}`} target="_blank"
                  ><mwc-button label="Open"></mwc-button
                ></a>
              `
            : ""}

          <mwc-button label="Edit" @click=${this._handleEdit}></mwc-button>
          <mwc-button label="Logs" @click=${this._handleLogs}></mwc-button>
          <div class="flex"></div>
          <esphome-button-menu
            corner="BOTTOM_RIGHT"
            @action=${this._handleOverflowAction}
          >
            <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
            <mwc-list-item>Validate</mwc-list-item>
            <mwc-list-item>Install</mwc-list-item>
            <mwc-list-item>Clean Build Files</mwc-list-item>
            <mwc-list-item>Delete</mwc-list-item>
            ${"mqtt" in this.device.loaded_integrations
              ? html`<mwc-list-item>Clean MQTT</mwc-list-item>`
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

  static styles = css`
    :host {
      --update-available-color: #2e3dd4;
    }
    esphome-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .device-config-path {
      margin-bottom: 8px;
      font-size: 14px;
    }
    .inlinecode {
      box-sizing: border-box;
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(27, 31, 35, 0.05);
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier,
        monospace;
    }
    .card-actions {
      display: flex;
      padding: 4px;
    }
    .flex {
      flex: 1;
    }
    .card-actions a {
      text-decoration: none;
    }
    mwc-button {
      --mdc-theme-primary: rgba(0, 0, 0, 0.88);
    }
    esphome-button-menu {
      cursor: pointer;
    }
    mwc-icon-button {
      --mdc-icon-button-size: 32px;
    }
    .update-available {
      --mdc-theme-primary: var(--update-available-color);
    }

    .tooltip-container {
      display: inline-block;
    }
  `;

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        openValidateDialog(this.device.configuration);
        break;
      case 1:
        this._handleInstall();
        break;
      case 2:
        openCleanDialog(this.device.configuration);
        break;
      case 3:
        console.log(this.device);
        const dialog = document.createElement("esphome-delete-device-dialog");
        dialog.name = this.device.name;
        dialog.configuration = this.device.configuration;
        dialog.addEventListener("deleted", () => fireEvent(this, "deleted"));
        document.body.append(dialog);
        break;
      case 4:
        openCleanMQTTDialog(this.device.configuration);
        break;
    }
  }

  private _handleEdit() {
    openEditDialog(this.device.configuration);
  }
  private _handleInstall() {
    openInstallDialog(this.device.configuration);
  }
  private _handleLogs() {
    openLogsTargetDialog(this.device.configuration);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-configured-device-card": ESPHomeConfiguredDeviceCard;
  }
}
