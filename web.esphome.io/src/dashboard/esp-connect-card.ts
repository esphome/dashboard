import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../../src/components/esphome-card";
import { openNoPortPickedDialog } from "../../../src/no-port-picked";
import { esphomeCardStyles } from "../../../src/styles";
import "./esp-device-card";

@customElement("ew-esp-connect-card")
class EWESPConnectCard extends LitElement {
  @property() private port?: SerialPort;

  protected render() {
    if (this.port) {
      return html`<ew-esp-device-card
        .port=${this.port}
        @close=${this.handleClose}
      ></ew-esp-device-card>`;
    }

    return html`
      <esphome-card status="NOT CONNECTED">
        <div class="card-header">ESP Device</div>
        <div class="card-content flex">
          Connect the ESP32 or ESP8266 to your computer and click on connect to
          start managing your device.
        </div>

        <div class="card-actions">
          <mwc-button
            icon="link"
            label="Connect"
            @click=${this.connect}
          ></mwc-button>
        </div>
      </esphome-card>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has("port")) {
      this.toggleAttribute("connected", this.port !== undefined);
    }
  }

  private async connect() {
    let port: SerialPort | undefined;
    try {
      port = await navigator.serial.requestPort();
    } catch (err: any) {
      if ((err as DOMException).name === "NotFoundError") {
        openNoPortPickedDialog();
        return;
      }
      alert(`Error: ${err.message}`);
      return;
    }

    if (!port) {
      return;
    }

    try {
      await port.open({ baudRate: 115200 });
    } catch (err: any) {
      alert(err.message);
      return;
    }
    this.port = port;
    port.addEventListener("disconnect", () => {
      this.port = undefined;
    });
  }

  private handleClose() {
    this.port = undefined;
  }

  static styles = [
    esphomeCardStyles,
    css`
      esphome-card {
        --status-color: var(--alert-warning-color);
      }
      .card-actions mwc-button {
        --mdc-theme-primary: var(--alert-warning-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-esp-connect-card": EWESPConnectCard;
  }
}
