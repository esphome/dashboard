import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../../src/components/esphome-card";
import { DOCS_WEBSERIAL } from "../../../src/const";
import "./device-card";

@customElement("ew-connect-card")
class EWConnectCard extends LitElement {
  @property() private port?: SerialPort;

  protected render() {
    if (this.port) {
      return html`<ew-device-card
        .port=${this.port}
        @close=${this.handleClose}
      ></ew-device-card>`;
    }

    return html`
      <esphome-card status="NOT CONNECTED">
        <div class="card-header">ESP Device</div>
        <div class="card-content flex">
          Connect the ESP8266 or ESP32 to your computer and click on connect. If
          you don't see your device in the list, make sure you have the
          <a href=${DOCS_WEBSERIAL} target="_blank">right drivers</a>.
        </div>

        <div class="card-actions">
          <mwc-button label="Connect" @click=${this.connect}></mwc-button>
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

  static styles = css`
    esphome-card {
      --status-color: var(--alert-warning-color);
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    a {
      color: var(--mdc-theme-primary);
    }
    .flex {
      flex: 1;
    }
    .card-actions {
      --mdc-theme-primary: var(--alert-warning-color);
    }
    .card-actions a {
      text-decoration: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-connect-card": EWConnectCard;
  }
}
