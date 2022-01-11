import { LitElement, html, css } from "lit";
import { customElement, query } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import { openInstallWebDialog } from "../../../src/install-web";

@customElement("esphome-install-upload-dialog")
class ESPHomeInstallUploadDialog extends LitElement {
  public port!: SerialPort;

  @query("input") private _input!: HTMLInputElement;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading="Select the project that you want to install"
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
          <input type="file" accept=".bin" @change=${this._fileChanged} />
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

  private _fileChanged() {
    this._input.classList.remove("error");
  }

  private async _handleInstall() {
    const input = this._input;

    if (!input.files || input.files.length === 0) {
      input.classList.add("error");
      return;
    }

    const files = [
      {
        data: await input.files[0].arrayBuffer(),
        offset: 0,
      },
    ];

    if (
      await openInstallWebDialog({
        port: this.port,
        erase: true,
        filesCallback: async () => files,
      })
    ) {
      this._close();
    }
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

    input {
      border: 1px solid transparent;
    }

    input.error {
      border-color: var(--alert-error-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-install-upload-dialog": ESPHomeInstallUploadDialog;
  }
}
