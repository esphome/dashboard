import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import { openInstallWebDialog } from "../../../src/install-web";
import { FileToFlash } from "../../../src/flash";

@customElement("esphome-install-adoptable-dialog")
class ESPHomeInstallAdoptableDialog extends LitElement {
  public port!: SerialPort;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading="Prepare your ESP device for adoption"
        scrimClickAction
        @closed=${this._handleClose}
      >
        <p>
          This will install a basic version of ESPHome to your device and help
          you connect it to your network.
        </p>
        <p>
          Once installed, your ESPHome dashboard will prompt you to adopt the
          device. This will set up a configuration for the device and allows you
          to further manage it wirelessly.
        </p>

        <mwc-button
          slot="secondaryAction"
          dialogAction="close"
          label="Close"
        ></mwc-button>
        <mwc-button
          slot="primaryAction"
          label="Make Adoptable"
          @click=${this._handleInstall}
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private async _handleInstall() {
    openInstallWebDialog(
      {
        port: this.port,
        async filesCallback(platform: string): Promise<FileToFlash[]> {
          if (platform !== "ESP8266" && platform !== "ESP32") {
            throw new Error("Only ESP8266 and ESP32 are currently supported");
          }
          const resp = await fetch(
            `/static_web/firmware/${platform.toLowerCase()}.bin`
          );
          if (!resp.ok) {
            throw new Error(
              `Downlading ESPHome firmware for ${platform} failed (${resp.status})`
            );
          }
          return [{ data: await resp.arrayBuffer(), offset: 0 }];
        },
        onClose(success) {
          if (!success) {
            return;
          }
          import("improv-wifi-serial-sdk/dist/serial-provision-dialog");
          const improv = document.createElement(
            "improv-wifi-serial-provision-dialog"
          );
          improv.port = this.port;
          document.body.appendChild(improv);
        },
      },
      () => this._close()
    );
  }

  private _close() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }

  private async _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = css`
    mwc-button[slot="secondaryAction"] {
      --mdc-theme-primary: #444;
      --mdc-theme-on-primary: white;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-install-adoptable-dialog": ESPHomeInstallAdoptableDialog;
  }
}
