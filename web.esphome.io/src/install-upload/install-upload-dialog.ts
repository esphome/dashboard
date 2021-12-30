import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";

@customElement("esphome-install-upload-dialog")
class ESPHomeInstallUploadDialog extends LitElement {
  public port!: SerialPort;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading="Select project that you want to install"
        scrimClickAction
        @closed=${this._handleClose}
      >
        <p>Install your existing ESPHome project to your ESP device.</p>
        <p>
          To get the installable file of your ESPHome project, open the ESPHome
          dashboard and on your project card click on menu (3 dots), install,
          manual download.
        </p>
        <p>
          <input type="file" accept=".bin" />
        </p>
        <mwc-button
          slot="secondaryAction"
          dialogAction="close"
          label="Close"
        ></mwc-button>
        <mwc-button
          slot="primaryAction"
          label="Install"
          @click=${this._handleInstall}
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleInstall() {
    alert("Not implemented yet!");
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
    "esphome-install-upload-dialog": ESPHomeInstallUploadDialog;
  }
}
