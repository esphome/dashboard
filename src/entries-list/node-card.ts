import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ConfiguredEntry } from "../api/list-entries";
import { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import "@material/mwc-button";
import "@material/mwc-icon-button";
import "@material/mwc-dialog";
import { Dialog } from "@material/mwc-dialog";
import "../components/esphome-button-menu";
import "../components/esphome-card";
import "@polymer/paper-tooltip/paper-tooltip.js";
import { openCleanMQTTDialog } from "../clean-mqtt";
import { openCleanDialog } from "../clean";
import { deleteConfiguration } from "../api/configuration";
import { fireEvent } from "../util/fire-event";
import { openValidateDialog } from "../validate";
import { openEditDialog } from "../legacy";
import { openInstallDialog } from "../install-update";
import { openLogsTargetDialog } from "../logs-target";

@customElement("esphome-node-card")
class ESPHomeNodeCard extends LitElement {
  @property() public entry!: ConfiguredEntry;
  @property() public onlineStatus!: boolean;

  @query("mwc-dialog") private _deleteDialog!: Dialog;

  protected render() {
    return html`
      <esphome-card
        class=${classMap({
          "status-online": this.onlineStatus === true,
          "status-offline": this.onlineStatus === false,
          "status-unknown":
            this.onlineStatus === null || this.onlineStatus === undefined,
        })}
      >
        <div class="card-header">
          ${this.entry.name}
          ${"web_server" in this.entry.loaded_integrations
            ? html`
                <div class="tooltip-container">
                  <a href=${`http://${this.entry.address}`} target="_blank">
                    <mwc-icon>launch</mwc-icon>
                  </a>
                  <paper-tooltip>Open Node Web Server Interface</paper-tooltip>
                </div>
              `
            : ""}
          ${this.entry.deployed_version != this.entry.current_version
            ? html`
                <div class="tooltip-container">
                  <mwc-icon class="update-available">system_update</mwc-icon>
                  <paper-tooltip
                    >Update Available: ${this.entry.deployed_version}
                    &#x27A1;&#xFE0F;${this.entry.current_version}</paper-tooltip
                  >
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
            ${"mqtt" in this.entry.loaded_integrations
              ? html`<mwc-list-item>Clean MQTT</mwc-list-item>`
              : ""}
          </esphome-button-menu>
        </div>

        <div class="card-content">
          <div class="node-config-path tooltip-container">
            <code class="inlinecode">${this.entry.filename}</code>
            <paper-tooltip>
              Full Path: <code class="inlinecode">${this.entry.path}</code>
            </paper-tooltip>
          </div>

          <div class="online-status">
            <span class="indicator"></span>
          </div>

          ${this.entry.comment
            ? html`<div class="node-card-comment">${this.entry.comment}</div>`
            : ""}
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

      <mwc-dialog>
        <div>Are you sure you want to delete ${this.entry.name}?</div>
        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          @click=${this._handleDelete}
        >
          Confirm
        </mwc-button>
        <mwc-button slot="secondaryAction" dialogAction="cancel">
          Cancel
        </mwc-button>
      </mwc-dialog>
    `;
  }

  static styles = css`
    .node-config-path {
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
  `;

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        openCleanDialog(this.entry.filename);
        break;
      case 1:
        this._deleteDialog.show();
        break;
      case 2:
        openCleanMQTTDialog(this.entry.filename);
        break;
    }
  }

  private async _handleDelete() {
    await deleteConfiguration(this.entry.filename);
    fireEvent(this, "deleted");
  }

  private _handleEdit() {
    openEditDialog(this.entry.filename);
  }
  private _handleValidate() {
    openValidateDialog(this.entry.filename);
  }
  private _handleInstall() {
    openInstallDialog(this.entry.filename);
  }
  private _handleLogs() {
    openLogsTargetDialog(this.entry.filename);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-node-card": ESPHomeNodeCard;
  }
}
