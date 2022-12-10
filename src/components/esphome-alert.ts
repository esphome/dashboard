import {
  mdiAlertCircleOutline,
  mdiAlertOutline,
  mdiCheckboxMarkedCircleOutline,
  mdiInformationOutline,
} from "@mdi/js";
import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import "./esphome-svg-icon";

const ALERT_ICONS = {
  info: mdiInformationOutline,
  warning: mdiAlertOutline,
  error: mdiAlertCircleOutline,
  success: mdiCheckboxMarkedCircleOutline,
};

@customElement("esphome-alert")
class ESPHomeAlert extends LitElement {
  @property() public title = "";

  @property({ attribute: "alert-type" }) public alertType:
    | "info"
    | "warning"
    | "error"
    | "success" = "info";

  @property({ type: Boolean }) public rtl = false;

  public render() {
    return html`
      <div
        class="issue-type ${classMap({
          rtl: this.rtl,
          [this.alertType]: true,
        })}"
        role="alert"
      >
        <div class="icon ${this.title ? "" : "no-title"}">
          <slot name="icon">
            <esphome-svg-icon
              .path=${ALERT_ICONS[this.alertType]}
            ></esphome-svg-icon>
          </slot>
        </div>
        <div class="content">
          <div class="main-content">
            ${this.title ? html`<div class="title">${this.title}</div>` : ""}
            <slot></slot>
          </div>
          <div class="action">
            <slot name="action"> </slot>
          </div>
        </div>
      </div>
    `;
  }

  static styles = css`
    .issue-type {
      position: relative;
      padding: 8px;
      display: flex;
      padding-left: var(--esphome-alert-padding-left, 8px);
    }
    .issue-type.rtl {
      flex-direction: row-reverse;
    }
    .issue-type::after {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      opacity: 0.12;
      pointer-events: none;
      content: "";
      border-radius: 4px;
    }
    .icon {
      z-index: 1;
    }
    .icon.no-title {
      align-self: center;
    }
    .issue-type.rtl > .content {
      flex-direction: row-reverse;
      text-align: right;
    }
    .content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .action {
      z-index: 1;
      width: min-content;
      --mdc-theme-primary: var(--primary-text-color);
    }
    .main-content {
      overflow-wrap: anywhere;
      word-break: break-word;
      margin-left: 8px;
      margin-right: 0;
    }
    .issue-type.rtl > .content > .main-content {
      margin-left: 0;
      margin-right: 8px;
    }
    .title {
      margin-top: 2px;
      font-weight: bold;
    }
    .action mwc-button,
    .action ha-icon-button {
      --mdc-theme-primary: var(--primary-text-color);
      --mdc-icon-button-size: 36px;
    }
    .issue-type.info > .icon {
      color: var(--alert-info-color);
    }
    .issue-type.info::after {
      background-color: var(--alert-info-color);
    }

    .issue-type.warning > .icon {
      color: var(--alert-warning-color);
    }
    .issue-type.warning::after {
      background-color: var(--alert-warning-color);
    }

    .issue-type.error > .icon {
      color: var(--alert-error-color);
    }
    .issue-type.error::after {
      background-color: var(--alert-error-color);
    }

    .issue-type.success > .icon {
      color: var(--alert-success-color);
    }
    .issue-type.success::after {
      background-color: var(--alert-success-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-alert": ESPHomeAlert;
  }
}
