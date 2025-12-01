import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { mdiClose } from "@mdi/js";
import "../../homeassistant-frontend/src/components/ha-dialog";
import "../../homeassistant-frontend/src/components/ha-dialog-header";
import "../../homeassistant-frontend/src/components/ha-button";
import "../../homeassistant-frontend/src/components/ha-icon-button";
import "../../homeassistant-frontend/src/components/ha-icon-picker";
import "../../homeassistant-frontend/src/components/ha-icon";
import { mockHass } from "../util/hass-mock";
import { fireEvent } from "../../homeassistant-frontend/src/common/dom/fire_event";

interface IconPickerDialogParams {
  deviceName: string;
  currentIcon?: string;
  onIconSelected?: (icon: string) => void;
}

let dialogParams: IconPickerDialogParams | undefined;
let dialogElement: ESPHomeIconPickerDialog | undefined;

export const openIconPickerDialog = (params: IconPickerDialogParams) => {
  dialogParams = params;
  if (!dialogElement) {
    dialogElement = document.createElement(
      "esphome-icon-picker-dialog"
    ) as ESPHomeIconPickerDialog;
    document.body.appendChild(dialogElement);
  }
  dialogElement.params = params;
  dialogElement.show();
};

@customElement("esphome-icon-picker-dialog")
export class ESPHomeIconPickerDialog extends LitElement {
  @property({ attribute: false }) public params?: IconPickerDialogParams;

  @state() private _open = false;
  @state() private _selectedIcon = "";

  public show() {
    this._selectedIcon = this.params?.currentIcon || "";
    this._open = true;
  }

  public close() {
    this._open = false;
  }

  private _handleClose() {
    this.close();
  }

  private _handleSave() {
    if (this._selectedIcon && this.params?.onIconSelected) {
      this.params.onIconSelected(this._selectedIcon);
    }
    this.close();
  }

  private _handleIconChanged(ev: CustomEvent) {
    this._selectedIcon = ev.detail.value || "";
  }

  protected render() {
    if (!this._open) {
      return nothing;
    }

    return html`
      <ha-dialog open @closed=${this._handleClose} heading="Change Icon">
        <ha-dialog-header slot="heading">
          <ha-icon-button
            slot="navigationIcon"
            .path=${mdiClose}
            @click=${this._handleClose}
            title="Close"
          ></ha-icon-button>
          <span slot="title">Change Icon</span>
        </ha-dialog-header>

        <div class="content">
          <p class="device-name">Device: ${this.params?.deviceName || ""}</p>

          <ha-icon-picker
            .hass=${mockHass}
            .value=${this._selectedIcon}
            .label=${"Icon"}
            .placeholder=${"mdi:chip"}
            @value-changed=${this._handleIconChanged}
          ></ha-icon-picker>

          ${this._selectedIcon
            ? html`
                <div class="preview">
                  <span>Preview:</span>
                  <ha-icon .icon=${this._selectedIcon}></ha-icon>
                  <span class="icon-name">${this._selectedIcon}</span>
                </div>
              `
            : nothing}
        </div>

        <ha-button slot="secondaryAction" @click=${this._handleClose}>
          Cancel
        </ha-button>
        <ha-button
          slot="primaryAction"
          @click=${this._handleSave}
          .disabled=${!this._selectedIcon}
        >
          Save
        </ha-button>
      </ha-dialog>
    `;
  }

  static styles = css`
    ha-dialog {
      --mdc-dialog-min-width: 400px;
      --mdc-dialog-max-width: 500px;
      --dialog-content-padding: 16px 24px;
      --dialog-z-index: 30;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .device-name {
      margin: 0;
      color: var(--secondary-text-color);
      font-size: 14px;
    }

    ha-icon-picker {
      width: 100%;
    }

    .preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 8px;
    }

    .preview ha-icon {
      --mdc-icon-size: 32px;
      color: var(--primary-text-color);
    }

    .icon-name {
      font-family: monospace;
      font-size: 14px;
      color: var(--primary-text-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-icon-picker-dialog": ESPHomeIconPickerDialog;
  }
}
