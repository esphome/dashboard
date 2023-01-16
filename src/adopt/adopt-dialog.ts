import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import "@material/mwc-textfield";
import type { TextField } from "@material/mwc-textfield";
import { fireEvent } from "../util/fire-event";
import { ImportableDevice, importDevice } from "../api/devices";
import { checkHasWifiSecrets, storeWifiSecrets } from "../api/wifi";
import { esphomeDialogStyles } from "../styles";
import { openInstallServerDialog } from "../install-server";

@customElement("esphome-adopt-dialog")
class ESPHomeAdoptDialog extends LitElement {
  @property() public device!: ImportableDevice;

  @state() private _hasWifiSecrets: boolean | undefined;

  @state() private _state: "ask" | "adopted" | "skipped" = "ask";
  @state() private _busy = false;
  @state() private _error?: string;

  private _nameOverride?: string;
  private _configFilename!: string;

  @query("mwc-textfield[name=ssid]") private _inputSSID!: TextField;
  @query("mwc-textfield[name=password]") private _inputPassword!: TextField;
  @query("mwc-textfield[name=name]") private _inputName!: TextField;

  protected render() {
    let heading;
    let content;

    if (this._state === "ask") {
      heading = "Adopt device";
      content = html`
        <div>
          Adopting ${this.device.friendly_name || this.device.name} will create
          an ESPHome configuration for this device. This allows you to install
          updates and customize the original firmware.
        </div>

        ${this._error ? html`<div class="error">${this._error}</div>` : ""}
        ${this.device.friendly_name
          ? html`
              <mwc-textfield
                label="New Name"
                name="name"
                required
                dialogInitialFocus
              ></mwc-textfield>
            `
          : ""}
        ${!this._needsWifiSecrets
          ? ""
          : this._hasWifiSecrets !== false
          ? html`
              <div>
                This device will be configured to connect to the Wi-Fi network
                stored in your secrets.
              </div>
            `
          : html`
              <div>
                Enter the credentials of the Wi-Fi network that you want your
                device to connect to.
              </div>
              <div>
                This information will be stored in your secrets and used for
                this and future devices. You can edit the information later by
                editing your secrets at the top of the page.
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
          .disabled=${this._needsWifiSecrets &&
          this._hasWifiSecrets === undefined}
        ></mwc-button>
        ${this._busy
          ? ""
          : html`
              <mwc-button
                no-attention
                slot="secondaryAction"
                label="Cancel"
                dialogAction="cancel"
              ></mwc-button>
            `}
      `;
    } else if (this._state === "adopted") {
      heading = "Configuration created";
      content = html`
        <div>
          To finish adoption of ${this._nameOverride || this.device.name}, the
          new configuration needs to be installed on the device.
        </div>

        <mwc-button
          slot="primaryAction"
          label="Install"
          @click=${this._handleInstall}
        ></mwc-button>
        <mwc-button
          slot="secondaryAction"
          no-attention
          label="skip"
          @click=${() => {
            this._state = "skipped";
          }}
        ></mwc-button>
      `;
    } else if (this._state === "skipped") {
      heading = "Installation skipped";
      content = html`
        <div>
          You will be able to install the configuration at a later point from
          the three-dot menu on the device card.
        </div>
        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          label="Close"
        ></mwc-button>
        <mwc-button
          slot="secondaryAction"
          no-attention
          label="back"
          @click=${() => {
            this._state = "adopted";
          }}
        ></mwc-button>
      `;
    }

    return html`
      <mwc-dialog .heading=${heading} @closed=${this._handleClose} open>
        ${content}
      </mwc-dialog>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    if (this._needsWifiSecrets) {
      checkHasWifiSecrets().then((hasWifiSecrets) => {
        this._hasWifiSecrets = hasWifiSecrets;
      });
    }
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (
      changedProps.has("_state") &&
      this._state === "ask" &&
      this.device.friendly_name
    ) {
      const nameEl = this._inputName;
      nameEl.value = this.device.friendly_name;
      nameEl.updateComplete.then(() => nameEl.focus());
    }
  }

  private get _needsWifiSecrets() {
    return this.device.network === "wifi";
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

    const hasFriendlyName = !!this.device.friendly_name;
    const shouldStoreWifiSecrets =
      this._needsWifiSecrets && this._hasWifiSecrets === false;

    const friendlyNameValid =
      !hasFriendlyName || this._inputName.reportValidity();
    const ssidValid =
      !shouldStoreWifiSecrets || this._inputSSID.reportValidity();

    if (!friendlyNameValid) {
      this._inputName.focus();
      return;
    } else if (!ssidValid) {
      this._inputSSID.focus();
      return;
    }

    if (shouldStoreWifiSecrets) {
      this._busy = true;
      try {
        await storeWifiSecrets(
          this._inputSSID.value,
          this._inputPassword.value
        );
      } catch (err) {
        console.error(err);
        this._busy = false;
        this._error = "Failed to store Wi-Fi credentials";
        return;
      }
    }

    this._busy = true;
    try {
      let data = this.device;
      if (hasFriendlyName) {
        data = { ...data, friendly_name: this._inputName.value };
        this._nameOverride = data.friendly_name;
      }
      const response = await importDevice(data);
      this._configFilename = response.configuration;
      fireEvent(this, "adopted");
      this._state = "adopted";
    } catch (err) {
      this._busy = false;
      this._error = "Failed to import device";
    }
  }

  private async _handleInstall() {
    openInstallServerDialog(this._configFilename, "OTA");
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
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
