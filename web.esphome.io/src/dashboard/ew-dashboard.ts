import { LitElement, html, css, PropertyValues } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-button";
import "./unsupported-card";
import "./esp-connect-card";
import { supportsWebSerial } from "../../../src/const";
import { ARROW } from "./arrow";

@customElement("ew-dashboard")
class EWDashboard extends LitElement {
  protected render() {
    return html`
      <div class="container">
        ${
          supportsWebSerial
            ? html`<ew-esp-connect-card></ew-esp-connect-card>`
            : html`<ew-unsupported-card></ew-unsupported-card>`
        }

        <div class="intro">
          ${ARROW}
          <div class="text">
            <p><b>Welcome to ESPHome Web!</b></p>
            <p>
              ESPHome Web allows you to install new versions and check the device logs directly from your browser.
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

        <div class="promote promote-install">
          ${ARROW}
          <div class="text">
            <p><b>Install downloaded project</b></p>
            <p>
              If you have a downloaded version of your project, you can install
              it on your device here.
            </p>
          </div>
        </div>

        <div class="promote promote-logs">
          ${ARROW}
          <div class="text">
            <p><b>Check logs</b></p>
            <p>
              Click here to check the device logs. If you don't see logs
              output, press the reset device button.
            </p>
          </div>
        </div>

        <div class="promote promote-adopt">
          </svg>
          <div class="text">
            <p><b>Make Adoptable</b>
            <svg width="48" height="48" viewBox="0 0 24 24"><path d="M21.5 9.5L20.09 10.92L17 7.83V13.5C17 17.09 14.09 20 10.5 20H4V18H10.5C13 18 15 16 15 13.5V7.83L11.91 10.91L10.5 9.5L16 4L21.5 9.5Z" /></svg>

          </p>
            <p>
              This action will prepare your device to be adopted by your ESPHome
              dashboard. Once adopted, a device can be configured and updated
              wirelessly.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    const highlight = location.search.substring(1);
    if (
      highlight === "dashboard_install" ||
      highlight === "dashboard_logs" ||
      highlight === "dashboard_wizard"
    ) {
      this.toggleAttribute(highlight);
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
    .promote-install {
      padding-left: 83px;
    }
    .promote-logs {
      padding-left: 20px;
    }
    ew-esp-connect-card ~ .promote,
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
    .arrow svg {
      position: relative;
      top: -13px;
    }
    .promote-adopt p:first-child {
      margin-top: 0;
    }
    .promote-adopt svg {
      position: relative;
      left: 32px;
      bottom: -5px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-dashboard": EWDashboard;
  }
}
