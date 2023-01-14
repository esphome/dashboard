import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import "../../../src/components/esphome-card";
import { metaChevronRight } from "../../../src/const";
import { esphomeCardStyles } from "../../../src/styles";
import { picoPortFilters } from "../../../src/util/pico-port-filter";
import { openInstallPicoDialog } from "../install-pico";
import "./pico-device-card";

@customElement("ew-pico-connect-card")
class EWPicoConnectCard extends LitElement {
  @property() private port?: SerialPort;

  protected render() {
    if (this.port) {
      return html`<ew-pico-device-card
        .port=${this.port}
        @close=${this.handleClose}
      ></ew-pico-device-card>`;
    }

    return html`
      <esphome-card status="NOT CONNECTED">
        <div class="card-header">Raspberry Pico W</div>
        <mwc-list-item twoline hasMeta @click=${this._showInitialInstall}>
          <span>First-time setup</span>
          <span slot="secondary">Install ESPHome on your Pico</span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item twoline hasMeta @click=${this.connect}>
          <span>Connect</span>
          <span slot="secondary">If your Pico already runs ESPHome</span>
          ${metaChevronRight}
        </mwc-list-item>
      </esphome-card>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has("port")) {
      this.toggleAttribute("connected", this.port !== undefined);
    }
  }

  private _showInitialInstall() {
    openInstallPicoDialog((port) => {
      this.port = port;
    });
  }

  private async connect() {
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
      mwc-list-item {
        --mdc-list-side-padding: 14px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-pico-connect-card": EWPicoConnectCard;
  }
}
