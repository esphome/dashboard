import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
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

@customElement("esphome-configured-device-card")
class ESPHomeConfiguredDeviceCard extends LitElement {
  @property() public device!: ConfiguredDevice;
  @property() public onlineStatus = false;
  @property() public highlight = false;

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

    return html`
      <esphome-card
        class=${classMap({
          "status-update-available": updateAvailable,
          "status-offline": this.onlineStatus === false,
          highlight: this.highlight,
        })}
      >
        <div class="status-bar"></div>
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

  static styles = css`
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
    .card-header {
      display: flex;
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
      --mdc-theme-primary: #3f51b5;
    }

    .status-bar {
      display: none;
      position: absolute;
      height: 4px;
      left: 0;
      right: 0;
      top: 0;
      border-top-left-radius: 2px;
      border-top-right-radius: 2px;
    }
    .status-bar::after {
      display: block;
      position: absolute;
      right: 4px;
      top: 5px;
      font-weight: bold;
      font-size: 12px;
    }
    .status-update-available .status-bar {
      display: block;
      background-color: #3f51b5;
      color: #3f51b5;
    }
    .status-update-available .status-bar::after {
      content: "UPDATE AVAILABLE";
    }
    .status-offline .status-bar {
      display: block;
      color: var(--alert-error-color);
      background-color: var(--alert-error-color);
    }
    .status-offline .status-bar::after {
      content: "OFFLINE";
    }

    .tooltip-container {
      display: inline-block;
    }

    .highlight {
      animation: higlight-bg 3s ease-in;
    }

    @keyframes higlight-bg {
      0% {
        background: rgba(255, 165, 0, 1);
      }
      20% {
        background: rgba(255, 165, 0, 0.8);
      }
      50% {
        background: rgba(255, 165, 0, 0.5);
      }
      70% {
        background: rgba(255, 165, 0, 0.5);
      }
      100% {
        background: rgba(255, 165, 0, 0);
      }
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
