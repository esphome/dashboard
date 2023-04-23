import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import { esphomeDialogStyles } from "../../../src/styles";
import { picoPortFilters } from "../../../src/util/pico-port-filter";

const DOWNLOAD_URL =
  "https://firmware.esphome.io/esphome-web/pico-w/esphome-web-rp2040.uf2";

@customElement("esphome-install-pico-dialog")
class ESPHomeInstallPicoDialog extends LitElement {
  public portSelectedCallback!: (port: SerialPort) => void;

  public render() {
    return html`
      <mwc-dialog
        open
        heading="Prepare your Raspberry Pi Pico W for first use"
        scrimClickAction
        @closed=${this._handleClose}
      >
        <div>
          To get started with ESPHome it needs to be installed on your Pico. You
          can do this using the file explorer on your computer following the
          steps below. You do not need any extra programs.
        </div>
        <ol>
          <li>Disconnect your Raspberry Pi Pico from your computer</li>
          <li>
            Hold the BOOTSEL button and connect the Pico to your computer. The
            Pico will show up as a USB drive named RPI-RP2
          </li>
          <li>
            Download
            <a href=${DOWNLOAD_URL}>ESPHome for Pico</a>
          </li>
          <li>
            Drag the downloaded file to the RPI-RP2 USB drive. The installation
            is complete when the drive disappears
          </li>
          <li>Your Pico now runs ESPHome 🎉</li>
        </ol>
        <div>
          Click CONTINUE to connect it to the Wi-Fi network. Once connected, it
          will automatically show up on your ESPHome dashboard.
        </div>
        <mwc-button
          slot="primaryAction"
          label="Continue"
          @click=${this._continue}
        ></mwc-button>
        <mwc-button
          slot="secondaryAction"
          dialogAction="close"
          label="Close"
          no-attention
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private async _continue() {
    import("improv-wifi-serial-sdk/dist/serial-provision-dialog");
    let port: SerialPort | undefined;
    try {
      port = await navigator.serial.requestPort({
        filters: picoPortFilters,
      });
    } catch (err: any) {
      if ((err as DOMException).name !== "NotFoundError") {
        alert(`Error: ${err.message}`);
      }
      return;
    }

    try {
      await port.open({ baudRate: 115200 });
    } catch (err: any) {
      alert(err.message);
      return;
    }

    const improv = document.createElement(
      "improv-wifi-serial-provision-dialog"
    );
    improv.port = port;
    improv.addEventListener("closed", (ev: any) => {
      if (ev.detail.improv) {
        this.portSelectedCallback(port!);
      }
    });
    document.body.appendChild(improv);
    this._close();
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
      li + li,
      li > ul {
        margin-top: 8px;
      }
      ul,
      ol {
        padding-left: 1.5em;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-install-pico-dialog": ESPHomeInstallPicoDialog;
  }
}
