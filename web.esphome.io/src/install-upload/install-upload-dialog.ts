import { LitElement, html, css } from "lit";
import { customElement, query } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "@material/mwc-icon";
import { openInstallWebDialog } from "../../../src/install-web";
import { esphomeDialogStyles } from "../../../src/styles";

@customElement("esphome-install-upload-dialog")
class ESPHomeInstallUploadDialog extends LitElement {
  public port!: SerialPort;

  @query("input") private _input!: HTMLInputElement;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading="Install your existing ESPHome project"
        scrimClickAction
        @closed=${this._handleClose}
      >
        <div>Select the project that you want to install on your device.</div>
        <div>
          <input type="file" accept=".bin" @change=${this._fileChanged} />
        </div>
        <div>To get the factory file of your ESPHome project:</div>
        <ol>
          <li>Open your ESPHome dashboard</li>
          <li>
            Find your device card click on menu (<mwc-icon>more_vert</mwc-icon>)
          </li>
          <li>Click on Install</li>
          <li>Click on Manual Download</li>
          <li>Click on Modern Format</li>
        </ol>
        <mwc-button
          slot="primaryAction"
          label="Install"
          @click=${this._handleInstall}
        ></mwc-button>
        <mwc-button
          no-attention
          slot="secondaryAction"
          dialogAction="close"
          label="Close"
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

    const reader = new FileReader();

    const data = await new Promise<string>((resolve) => {
      reader.addEventListener("load", () => resolve(reader.result as string));
      reader.readAsBinaryString(input.files![0]);
    });

    const files = [
      {
        data,
        address: 0,
      },
    ];

    openInstallWebDialog(
      {
        port: this.port,
        erase: true,
        filesCallback: async () => files,
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

  static styles = [
    esphomeDialogStyles,
    css`
      input {
        border: 1px solid transparent;
      }

      mwc-icon {
        vertical-align: middle;
      }

      ol {
        margin-bottom: 0;
      }

      input.error {
        border-color: var(--alert-error-color);
      }

      input[type="file"] {
        background-color: var(--mdc-text-field-fill-color);
        width: 95%;
        padding: 10px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-install-upload-dialog": ESPHomeInstallUploadDialog;
  }
}
