import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-textfield";
import type { TextField } from "@material/mwc-textfield";
import { fireEvent } from "../util/fire-event";
import { ImportableDevice, importDevice } from "../api/devices";
import { checkHasWifiSecrets, storeWifiSecrets } from "../api/wifi";
import { openInstallChooseDialog } from "../install-choose";
import { esphomeDialogStyles } from "../styles";

@customElement("esphome-adopt-dialog")
class ESPHomeAdoptDialog extends LitElement {
  @property() public device!: ImportableDevice;

  @state() private _hasWifiSecrets: boolean | undefined;

  @state() private _adopted = false;
  @state() private _busy = false;
  @state() private _error?: string;

  @query("mwc-textfield[name=ssid]") private _inputSSID!: TextField;
  @query("mwc-textfield[name=password]") private _inputPassword!: TextField;

  protected render() {
    return html`
      <mwc-dialog
        .heading=${this._adopted ? "Configuration created" : `Adopt device`}
        @closed=${this._handleClose}
        open
      >
        ${this._adopted
          ? html`
              <div>
                To finish adoption, the new configuration needs to be installed
                on the device. This can be done wirelessly.
              </div>
              <mwc-button
                slot="primaryAction"
                dialogAction="install"
                label="Install"
                @click=${() =>
                  openInstallChooseDialog(`${this.device.name}.yaml`)}
              ></mwc-button>
              <mwc-button
                slot="secondaryAction"
                dialogAction="skip"
                label="skip"
              ></mwc-button>
            `
          : html`
              <div>
                Adopting ${this.device.name} will create an ESPHome
                configuration for this device allowing you to install updates
                and customize the original firmware.
              </div>

              ${this._error
                ? html`<div class="error">${this._error}</div>`
                : ""}
              ${this._hasWifiSecrets !== false
                ? html`
                    <div>
                      This device will be configured to connect to the Wi-Fi
                      network stored in your secrets.
                    </div>
                  `
                : html`
                    <div>
                      Enter the credentials of the Wi-Fi network that you want
                      your device to connect to.
                    </div>
                    <div>
                      This information will be stored in your secrets and used
                      for this and future devices. You can edit the information
                      later by editing your secrets at the top of the page.
                    </div>

                    <mwc-textfield
                      label="Network name"
                      name="ssid"
                      required
                      @blur=${this._cleanSSIDBlur}
                      .disabled=${this._busy}
                    ></mwc-textfield>

                    <mwc-textfield
                      label="Password"
                      name="password"
                      type="password"
                      helper="Leave blank if no password"
                      .disabled=${this._busy}
                    ></mwc-textfield>
                  `}

              <mwc-button
                slot="primaryAction"
                .label=${this._busy ? "Adopting…" : "Adopt"}
                @click=${this._handleAdopt}
                .disabled=${this._hasWifiSecrets === undefined}
              ></mwc-button>
              ${this._busy
                ? ""
                : html`
                    <mwc-button
                      slot="secondaryAction"
                      label="Cancel"
                      dialogAction="cancel"
                    ></mwc-button>
                  `}
            `}
      </mwc-dialog>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    checkHasWifiSecrets().then((hasWifiSecrets) => {
      this._hasWifiSecrets = hasWifiSecrets;
    });
  }

  private _cleanSSIDBlur = (ev: Event) => {
    const input = ev.target as TextField;
    // Remove starting and trailing whitespace
    input.value = input.value.trim();
  };

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  private async _handleAdopt() {
    this._error = undefined;

    if (this._hasWifiSecrets === false) {
      if (!this._inputSSID.reportValidity()) {
        this._inputSSID.focus();
        return;
      }

      this._busy = true;

      try {
        await storeWifiSecrets(
          this._inputSSID.value,
          this._inputPassword.value
        );
      } catch (err) {
        this._busy = false;
        this._error = "Failed to store Wi-Fi credentials";
        return;
      }
    }
    this._busy = true;
    try {
      await importDevice(this.device);
      fireEvent(this, "adopted");
      this._adopted = true;
    } catch (err) {
      this._busy = false;
      this._error = "Failed to import device";
    }
  }

  static styles = [
    esphomeDialogStyles,
    css`
      :host {
        --mdc-dialog-max-width: 390px;
      }
      .error {
        color: var(--alert-error-color);
        margin-bottom: 16px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-adopt-dialog": ESPHomeAdoptDialog;
  }
}
