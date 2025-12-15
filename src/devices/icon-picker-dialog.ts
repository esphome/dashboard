import { LitElement, html, css, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { mdiClose } from "@mdi/js";
import "@material/mwc-textfield";
import "../../homeassistant-frontend/src/components/ha-dialog";
import "../../homeassistant-frontend/src/components/ha-dialog-header";
import "../../homeassistant-frontend/src/components/ha-button";
import "../../homeassistant-frontend/src/components/ha-icon-button";
import "../components/esphome-mdi-icon";

interface IconPickerDialogParams {
  deviceName: string;
  currentIcon?: string;
  onIconSelected?: (icon: string) => void;
}

let dialogElement: ESPHomeIconPickerDialog | undefined;

export const openIconPickerDialog = (params: IconPickerDialogParams) => {
  if (!dialogElement) {
    dialogElement = document.createElement(
      "esphome-icon-picker-dialog",
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

  private _handleInputChange(ev: InputEvent) {
    const input = ev.target as HTMLInputElement;
    this._selectedIcon = input.value || "";
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

          <mwc-textfield
            label="Icon"
            placeholder="mdi:chip"
            .value=${this._selectedIcon}
            @input=${this._handleInputChange}
            helper="Enter an MDI icon name (e.g., mdi:lightbulb, mdi:thermometer)"
          ></mwc-textfield>

          <div class="preview">
            <span class="preview-label">Preview:</span>
            ${this._selectedIcon
              ? html`
                  <esphome-mdi-icon
                    .icon=${this._selectedIcon}
                  ></esphome-mdi-icon>
                  <span class="icon-name">${this._selectedIcon}</span>
                `
              : html`<span class="no-icon">No icon selected</span>`}
          </div>

          <div class="common-icons">
            <span class="common-label">Common icons:</span>
            <div class="icon-grid">
              ${this._renderQuickIcon("mdi:chip")}
              ${this._renderQuickIcon("mdi:lightbulb")}
              ${this._renderQuickIcon("mdi:thermometer")}
              ${this._renderQuickIcon("mdi:motion-sensor")}
              ${this._renderQuickIcon("mdi:microphone")}
              ${this._renderQuickIcon("mdi:fan")}
              ${this._renderQuickIcon("mdi:power-plug")}
              ${this._renderQuickIcon("mdi:led-strip")}
              ${this._renderQuickIcon("mdi:speaker")}
              ${this._renderQuickIcon("mdi:gauge")}
              ${this._renderQuickIcon("mdi:water")}
              ${this._renderQuickIcon("mdi:air-filter")}
            </div>
          </div>

          <p class="help-text">
            Browse all icons at
            <a
              href="https://pictogrammers.com/library/mdi/"
              target="_blank"
              rel="noopener"
            >
              pictogrammers.com/library/mdi
            </a>
          </p>
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

  private _renderQuickIcon(icon: string) {
    const isSelected = this._selectedIcon === icon;
    return html`
      <div
        class="quick-icon ${isSelected ? "selected" : ""}"
        @click=${() => this._selectIcon(icon)}
        title=${icon}
      >
        <esphome-mdi-icon .icon=${icon}></esphome-mdi-icon>
      </div>
    `;
  }

  private _selectIcon(icon: string) {
    this._selectedIcon = icon;
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

    mwc-textfield {
      width: 100%;
    }

    .preview {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--secondary-background-color, #f5f5f5);
      border-radius: 8px;
      min-height: 32px;
    }

    .preview-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }

    .preview esphome-mdi-icon {
      --mdc-icon-size: 32px;
      color: var(--primary-text-color);
    }

    .icon-name {
      font-family: monospace;
      font-size: 14px;
      color: var(--primary-text-color);
    }

    .no-icon {
      color: var(--secondary-text-color);
      font-style: italic;
      font-size: 14px;
    }

    .common-icons {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .common-label {
      color: var(--secondary-text-color);
      font-size: 14px;
    }

    .icon-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 8px;
    }

    .quick-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      cursor: pointer;
      background: var(--secondary-background-color, #f5f5f5);
      transition:
        background-color 0.2s ease,
        border-color 0.2s ease;
      border: 2px solid transparent;
    }

    .quick-icon:hover {
      background: var(--primary-background-color);
      border-color: var(--primary-color);
    }

    .quick-icon.selected {
      background: var(--primary-color);
      border-color: var(--primary-color);
    }

    .quick-icon.selected esphome-mdi-icon {
      color: var(--text-primary-color, white);
    }

    .quick-icon esphome-mdi-icon {
      --mdc-icon-size: 24px;
      color: var(--primary-text-color);
    }

    .help-text {
      margin: 0;
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .help-text a {
      color: var(--primary-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-icon-picker-dialog": ESPHomeIconPickerDialog;
  }
}
