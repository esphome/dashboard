import { LitElement, html, css, svg, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ConfiguredDevice } from "../api/devices";
import { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
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

    return html`
      <esphome-card
        class=${classMap({
          "status-offline": this.onlineStatus === false,
          highlight: this.highlight,
        })}
      >
        <div class="card-header">
          ${this.device.name}
          ${this.onlineStatus !== false
            ? ""
            : html`
                <div class="tooltip-container">
                  ${svg`
                    <svg class='offline' xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                      <path d="M14.83,13.83C15.55,13.11 16,12.11 16,11C16,9.89 15.55,8.89 14.83,8.17L16.24,6.76C17.33,7.85 18,9.35 18,11C18,12.65 17.33,14.15 16.24,15.24L14.83,13.83M14,11A2,2 0 0,0 12,9C11.4,9 10.87,9.27 10.5,9.68L13.32,12.5C13.73,12.13 14,11.6 14,11M17.66,16.66L19.07,18.07C20.88,16.26 22,13.76 22,11C22,8.24 20.88,5.74 19.07,3.93L17.66,5.34C19.11,6.78 20,8.79 20,11C20,13.22 19.11,15.22 17.66,16.66M22,21.18V20H20.82L22,21.18M20.27,22L21,22.73L19.73,24L17.73,22H15A1,1 0 0,1 14,23H10A1,1 0 0,1 9,22H2V20H9A1,1 0 0,1 10,19H11V15.27L8.34,12.61C8.54,13.07 8.82,13.5 9.17,13.83L7.76,15.24C6.67,14.15 6,12.65 6,11C6,10.77 6,10.54 6.04,10.31L4.37,8.64C4.14,9.39 4,10.18 4,11C4,13.22 4.89,15.22 6.34,16.66L4.93,18.07C3.12,16.26 2,13.76 2,11C2,9.61 2.29,8.28 2.81,7.08L1,5.27L2.28,4L3.7,5.42L5.15,6.87L6.63,8.35V8.35L8.17,9.9L10.28,12L11,12.71L18.27,20H18.28L20.28,22H20.27M15.73,20L13,17.27V19H14A1,1 0 0,1 15,20H15.73Z" />
                    </svg>
                  `}
                  <paper-tooltip> Device is offline. </paper-tooltip>
                </div>
              `}
          ${this.device.deployed_version != this.device.current_version
            ? html`
                <div class="tooltip-container">
                  <mwc-icon-button
                    @click=${this._handleInstall}
                    class="update-available"
                    icon="system_update"
                    label="Install Update"
                  ></mwc-icon-button>
                  <paper-tooltip>
                    Update Available: ${this.device.deployed_version}
                    ${UPDATE_TO_ICON} ${this.device.current_version}
                  </paper-tooltip>
                </div>
              `
            : ""}
        </div>

        ${content.length
          ? html`<div class="card-content">${content}</div>`
          : ""}

        <div class="card-actions">
          ${this.device.loaded_integrations.includes("web_server")
            ? html`
                <a href=${`http://${this.device.address}`} target="_blank"
                  ><mwc-button label="Open"></mwc-button
                ></a>
              `
            : ""}

          <mwc-button label="Edit" @click=${this._handleEdit}></mwc-button>
          <mwc-button label="Logs" @click=${this._handleLogs}></mwc-button>
          <div class="spacer"></div>
          <esphome-button-menu
            corner="TOP_START"
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
      padding-right: 36px;
    }
    .card-actions {
      display: flex;
      padding: 4px;
    }
    .spacer {
      flex: 1;
    }
    .card-actions a {
      text-decoration: none;
    }
    mwc-button {
      --mdc-theme-primary: #ffab40;
    }
    esphome-button-menu {
      cursor: pointer;
    }
    mwc-icon-button {
      --mdc-icon-button-size: 32px;
    }
    .update-available {
      color: #3f51b5;
    }

    .offline {
      padding: 4px;
      fill: var(--alert-error-color);
      vertical-align: top;
    }

    esphome-card {
      border-top: 4px solid var(--alert-success-color);
    }
    esphome-card.status-offline {
      border-top-color: var(--alert-error-color);
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
