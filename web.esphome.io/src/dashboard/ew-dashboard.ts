import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-button";
import "./unsupported-card";
import "./connect-card";
import { supportsWebSerial } from "../../../src/const";

@customElement("ew-dashboard")
class EWDashboard extends LitElement {
  protected render() {
    return html`
      <div class="container">
        ${supportsWebSerial
          ? html`<ew-connect-card></ew-connect-card>`
          : html`<ew-unsupported-card></ew-unsupported-card>`}
        <div class="intro">
          <div class="arrow">
            <svg width="48" height="48" viewBox="0 0 24 24">
              <path
                d="M20 18V20H13.5C9.91 20 7 17.09 7 13.5V7.83L3.91 10.92L2.5 9.5L8 4L13.5 9.5L12.09 10.91L9 7.83V13.5C9 16 11 18 13.5 18H20Z"
              />
            </svg>
          </div>
          <div class="text">
            <p><b>Welcome to ESPHome Web!</b></p>
            <p>
              ESPHome Web allows you to check the logs of your ESP device and
              install new versions directly from your browser.
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
      </div>
    `;
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
    .intro {
      position: relative;
      transition: opacity 0.3s;
      display: flex;
      padding: 32px 0 0 32px;
    }
    ew-connect-card[connected] + .intro {
      opacity: 0;
      pointer-events: none;
    }
    .text {
      margin-left: 16px;
      padding-right: 8px;
      flex: 1;
    }
    .arrow svg {
      position: relative;
      top: -11px;
    }
    @media only screen and (max-width: 550px) {
      :host {
        width: 100%;
      }
      :host > * {
        max-width: initial;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-dashboard": EWDashboard;
  }
}
