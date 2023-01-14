import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-button";
import "./unsupported-card";
import "./esp-connect-card";
import "./pico-connect-card";
import { supportsWebSerial } from "../../../src/const";
import { ARROW, ARROW_RIGHT } from "./arrow";

@customElement("ew-dashboard")
class EWDashboard extends LitElement {
  @state() private pico = false;

  protected render() {
    return html`
      <div class="container">
        ${!supportsWebSerial
          ? html`<ew-unsupported-card></ew-unsupported-card>`
          : this.pico
          ? html`<ew-pico-connect-card></ew-pico-connect-card>`
          : html`<ew-esp-connect-card></ew-esp-connect-card>`}

        <div class="intro">
          ${ARROW}
          <div class="text">
            <p><b>Welcome to ESPHome Web!</b></p>
            <p>
              ESPHome Web allows you to prepare your
              ${this.pico
                ? html`
                    <a
                      href="https://www.raspberrypi.com/products/raspberry-pi-pico/"
                      >Raspberry&nbsp;Pi Pico&nbsp;W</a
                    >
                  `
                : "device"}
              for first use${this.pico ? "" : ", install new versions"} and
              check the device logs directly from your browser.
            </p>
            <p>
              ESPHome Web runs 100% in your browser. No data will leave your
              computer.
            </p>
            <p>
              This page is a lite variant of ESPHome. If you want to create and
              edit ESPHome projects, install ESPHome on your computer or inside
              Home&nbsp;Assistant (it's free!).
            </p>
            <p>
              <a href="https://esphome.io/guides/getting_started_hassio.html"
                >Get ESPHome</a
              >
            </p>
          </div>
        </div>

        <div class="promote promote-install right-arrow">
          <div class="text">
            <p>
              <b>Install downloaded project</b>
              ${ARROW_RIGHT}
            </p>
            <p>
              If you have a downloaded version of your project, you can install
              it on your device here.
            </p>
          </div>
        </div>

        <div class="promote promote-logs right-arrow">
          <div class="text">
            <p>
              <b>Check logs</b>
              ${ARROW_RIGHT}
            </p>
            <p>
              Click here to check the device logs. If you don't see logs output,
              press the reset device button.
            </p>
          </div>
        </div>

        <div class="promote promote-adopt">
          ${ARROW}
          <div class="text">
            <p>
              <b>Prepare for first use</b>
            </p>
            <p>
              Install ESPHome on your device to add it to your ESPHome
              dashboard. Once added, a device can be configured and updated
              wirelessly.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    const params = new URLSearchParams(location.search);

    for (const key of params.keys()) {
      if (key === "pico") {
        this.pico = true;
      } else if (key.startsWith("dashboard_")) {
        this.toggleAttribute(key);
        break;
      }
    }
  }

  static styles = css`
    .container {
      display: flex;
      flex-direction: column;
      margin: 20px auto;
      width: 90%;
      max-width: 1920px;
      align-items: center;
    }
    a {
      color: var(--mdc-theme-primary);
    }
    .container > * {
      display: block;
      box-sizing: border-box;
      width: 100%;
      max-width: 450px;
    }
    .intro,
    .promote {
      position: relative;
      display: flex;
      padding-top: 32px;
    }
    .intro {
      padding-left: 32px;
    }
    ew-esp-connect-card[connected] + .intro {
      display: none;
    }
    ew-esp-connect-card ~ .promote,
    ew-pico-connect-card ~ .promote,
    ew-unsupported-card ~ .promote {
      display: none;
    }
    :host([dashboard_logs]) ew-esp-connect-card[connected] ~ .promote-logs {
      display: flex;
    }
    :host([dashboard_install])
      ew-esp-connect-card[connected]
      ~ .promote-install {
      display: flex;
    }
    :host([dashboard_wizard]) ew-esp-connect-card[connected] ~ .promote-adopt {
      display: flex;
    }
    .text {
      margin-left: 16px;
      padding-right: 8px;
      flex: 1;
    }
    .promote-adopt {
      margin-left: 180px;
    }
    .promote-install {
      padding-left: 5px;
    }
    .promote-logs {
      padding-left: 80px;
    }
    .arrow svg {
      position: relative;
      top: -13px;
    }
    .right-arrow p:first-child {
      margin-top: 0;
    }
    .right-arrow svg {
      position: relative;
      bottom: -5px;
    }
    .promote-logs.right-arrow svg {
      left: 108px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-dashboard": EWDashboard;
  }
}
