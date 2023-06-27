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
import "../components/esphome-svg-icon";
import "@polymer/paper-tooltip/paper-tooltip.js";
import { openCleanMQTTDialog } from "../clean-mqtt";
import { openCleanDialog } from "../clean";
import { openValidateDialog } from "../validate";
import { openInstallChooseDialog } from "../install-choose";
import { openLogsTargetDialog } from "../logs-target";
import { fireEvent } from "../util/fire-event";
import { openDeleteDeviceDialog } from "../delete-device";
import { esphomeCardStyles } from "../styles";
import { openRenameDialog } from "../rename";
import { openShowApiKeyDialog } from "../show-api-key";
import { openEditDialog } from "../editor";
import { getFile } from "../api/files";
import { textDownload } from "../util/file-download";
import {
  mdiBroom,
  mdiCodeBraces,
  mdiDelete,
  mdiKey,
  mdiRenameBox,
  mdiSpellcheck,
  mdiUploadNetwork,
} from "@mdi/js";

const UPDATE_TO_ICON = "➡️";
const STATUS_COLORS = {
  NEW: "var(--status-new)",
  OFFLINE: "var(--alert-error-color)",
  "UPDATE AVAILABLE": "var(--update-available-color)",
  ONLINE: "var(--status-connected)",
};

@customElement("esphome-configured-device-card")
class ESPHomeConfiguredDeviceCard extends LitElement {
  @property() public device!: ConfiguredDevice;
  @property() public onlineStatus?: boolean;
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
      this.device.friendly_name ||
      (this.device.configuration !== `${this.device.name}.yaml` &&
        this.device.configuration !== `${this.device.name}.yml`)
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
      : this.onlineStatus && updateAvailable
      ? "UPDATE AVAILABLE"
      : this.onlineStatus
      ? "ONLINE"
      : "OFFLINE";
    return html`
      <esphome-card
        .status=${status}
        .noStatusBar=${status === "ONLINE"}
        style=${styleMap({
          "--status-color": status === undefined ? "" : STATUS_COLORS[status],
        })}
      >
        <div class="card-header">
          ${this.device.friendly_name || this.device.name}
        </div>

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
          ${this.device.loaded_integrations?.includes("web_server")
            ? html`
                <a
                  href=${`http://${this.device.address}${
                    this.device.web_port && this.device.web_port != 80
                      ? `:${this.device.web_port}`
                      : ``
                  }`}
                  target="_blank"
                  ><mwc-button label="Visit"></mwc-button
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
              <esphome-svg-icon
                slot="graphic"
                .path=${mdiKey}
              ></esphome-svg-icon>
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
            <li divider role="separator"></li>
            <mwc-list-item class="warning" graphic="icon">
              Delete
              <esphome-svg-icon
                class="warning"
                slot="graphic"
                .path=${mdiDelete}
              ></esphome-svg-icon>
            </mwc-list-item>
            ${this.device.loaded_integrations?.includes("mqtt")
              ? html`<mwc-list-item graphic="icon">
                  Clean MQTT
                  <esphome-svg-icon
                    slot="graphic"
                    .path=${mdiBroom}
                  ></esphome-svg-icon>
                </mwc-list-item>`
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

  static styles = [
    esphomeCardStyles,
    css`
      .device-config-path {
        margin-bottom: 8px;
        font-size: 14px;
      }
      .inlinecode {
        box-sizing: border-box;
        padding: 0.2em 0.4em;
        margin: 0;
        font-size: 85%;
        background-color: var(--card-background-color)
        border-radius: 3px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
          Courier, monospace;
      }
      .card-actions mwc-button.update-available {
        --mdc-theme-primary: var(--update-available-color);
      }
      esphome-button-menu {
        --mdc-theme-text-icon-on-background: var(--primary-text-color);
      }
      .tooltip-container {
        display: inline-block;
      }
      .warning {
        color: var(--alert-error-color);
      }
      .mdc-icon-button {
        color: var(--primary-text-color);
      }
    `,
  ];

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        openValidateDialog(this.device.configuration);
        break;
      case 1:
        this._handleInstall();
        break;
      case 2:
        openShowApiKeyDialog(this.device.configuration);
        break;
      case 3:
        this._handleDownloadYaml();
        break;
      case 4:
        openRenameDialog(this.device.configuration, this.device.name);
        break;
      case 5:
        openCleanDialog(this.device.configuration);
        break;
      case 6:
        openDeleteDeviceDialog(
          this.device.name,
          this.device.configuration,
          () => fireEvent(this, "deleted")
        );
        break;
      case 7:
        openCleanMQTTDialog(this.device.configuration);
        break;
    }
  }

  private _handleEdit() {
    openEditDialog(this.device.configuration);
  }
  private _handleInstall() {
    openInstallChooseDialog(this.device.configuration);
  }
  private _handleLogs() {
    openLogsTargetDialog(this.device.configuration);
  }

  private async _handleDownloadYaml() {
    getFile(this.device.configuration).then((config) => {
      textDownload(config!, this.device.configuration);
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-configured-device-card": ESPHomeConfiguredDeviceCard;
  }
}
