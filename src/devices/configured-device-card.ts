import { LitElement, html, css } from "lit";
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
    return html`
      <esphome-card
        class=${classMap({
          "status-online": this.onlineStatus === true,
          "status-offline": this.onlineStatus === false,
          "status-unknown":
            this.onlineStatus === null || this.onlineStatus === undefined,
          highlight: this.highlight,
        })}
      >
        <div class="card-header">
          ${this.device.name}
          ${this.device.loaded_integrations.includes("web_server")
            ? html`
                <div class="tooltip-container">
                  <a href=${`http://${this.device.address}`} target="_blank">
                    <mwc-icon-button
                      icon="launch"
                      label="Open web UI"
                    ></mwc-icon-button>
                  </a>
                  <paper-tooltip>
                    Open device web server interface
                  </paper-tooltip>
                </div>
              `
            : ""}
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

          <esphome-button-menu
            corner="TOP_START"
            @action=${this._handleOverflowAction}
          >
            <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
            <mwc-list-item>Clean Build Files</mwc-list-item>
            <mwc-list-item>Delete</mwc-list-item>
            ${"mqtt" in this.device.loaded_integrations
              ? html`<mwc-list-item>Clean MQTT</mwc-list-item>`
              : ""}
          </esphome-button-menu>
        </div>

        <div class="card-content">
          ${this.device.configuration === `${this.device.name}.yaml` ||
          this.device.configuration === `${this.device.name}.yml`
            ? ""
            : html`
                <div class="device-config-path tooltip-container">
                  <code class="inlinecode">${this.device.configuration}</code>
                  <paper-tooltip>
                    Full Path:
                    <code class="inlinecode">${this.device.path}</code>
                  </paper-tooltip>
                </div>
              `}

          ${this.onlineStatus === true
            ? ""
            : html`
                <div class="online-status">
                  <span class="indicator"></span>
                </div>
              `}
          ${this.device.comment ? html`<div>${this.device.comment}</div>` : ""}
        </div>

        <div class="card-actions">
          <mwc-button label="Edit" @click=${this._handleEdit}></mwc-button>
          <mwc-button
            label="Validate"
            @click=${this._handleValidate}
          ></mwc-button>
          <mwc-button
            label="Install"
            @click=${this._handleInstall}
          ></mwc-button>
          <mwc-button label="Logs" @click=${this._handleLogs}></mwc-button>
        </div>
      </esphome-card>
    `;
  }

  static styles = css`
    .device-config-path {
      margin-top: -8px;
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
      padding: 4px;
    }
    mwc-button {
      --mdc-theme-primary: #ffab40;
    }
    esphome-button-menu {
      float: right;
      cursor: pointer;
    }
    mwc-icon-button {
      --mdc-icon-button-size: 32px;
    }
    .update-available {
      color: #3f51b5;
    }

    .online-status {
      text-transform: uppercase;
      font-size: 12px;
      font-weight: bold;
      display: flex;
      align-items: baseline;
    }

    .online-status .indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      background-color: grey;
      margin-right: 5px;
      border-radius: 50%;
    }

    .status-unknown .online-status:after {
      content: "Unknown status";
    }

    .status-online .online-status:after {
      content: "Online";
    }
    .status-online .online-status .indicator {
      background-color: var(--alert-success-color);
    }

    .status-offline .online-status:after {
      content: "Offline";
    }
    .status-offline .online-status .indicator {
      background-color: var(--alert-error-color);
    }

    esphome-card.status-offline {
      border-top: 4px solid var(--alert-error-color);
    }
    esphome-card.status-online {
      border-top: 4px solid var(--alert-success-color);
    }
    esphome-card.status-unknown {
      border-top: 4px solid var(--alert-standard-color);
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
        openCleanDialog(this.device.configuration);
        break;
      case 1:
        console.log(this.device);
        const dialog = document.createElement("esphome-delete-device-dialog");
        dialog.name = this.device.name;
        dialog.configuration = this.device.configuration;
        dialog.addEventListener("deleted", () => fireEvent(this, "deleted"));
        document.body.append(dialog);
        break;
      case 2:
        openCleanMQTTDialog(this.device.configuration);
        break;
    }
  }

  private _handleEdit() {
    openEditDialog(this.device.configuration);
  }
  private _handleValidate() {
    openValidateDialog(this.device.configuration);
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
