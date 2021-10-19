import { css, html, LitElement, TemplateResult } from "lit";
import { state, customElement } from "lit/decorators.js";
import "./esphome-button-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import "@material/mwc-button";
import type { ActionDetail } from "@material/mwc-list/mwc-list-foundation";
import { openEditDialog } from "../legacy";
import { openUpdateAllDialog } from "../update-all";
import {
  canUpdateDevice,
  ListDevicesResult,
  subscribeDevices,
} from "../api/devices";

const isWideListener = window.matchMedia("(min-width: 601px)");

@customElement("esphome-header-menu")
export class ESPHomeHeaderMenu extends LitElement {
  @state() private _devices?: ListDevicesResult["configured"];

  @state() private _isWide = isWideListener.matches;

  private _unsubDevices?: ReturnType<typeof subscribeDevices>;

  protected render(): TemplateResult {
    const updateCount = this._updateCount;

    if (this._isWide) {
      return html`
        ${updateCount === 0
          ? ""
          : html`
              <mwc-button
                label="Update All"
                @click=${this._handleUpdateAll}
              ></mwc-button>
            `}
        <mwc-button
          label="Secrets Editor"
          @click=${this._handleEditSecrets}
        ></mwc-button>
      `;
    }

    return html`
      <esphome-button-menu
        corner="BOTTOM_START"
        @action=${this._handleOverflowAction}
      >
        <mwc-icon-button slot="trigger" icon="more_vert"></mwc-icon-button>
        <mwc-list-item>Update All</mwc-list-item>
        <mwc-list-item>Secrets Editor</mwc-list-item>
        <slot></slot>
      </esphome-button-menu>
    `;
  }

  private get _updateCount() {
    return this._devices
      ? this._devices.reduce(
          (prev, device) => prev + (canUpdateDevice(device) ? 1 : 0),
          0
        )
      : 0;
  }

  connectedCallback() {
    super.connectedCallback();
    this._unsubDevices = subscribeDevices((result) => {
      this._devices = result.configured;
    });
    isWideListener.addEventListener("change", this._isWideUpdated);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._unsubDevices) {
      this._unsubDevices();
      this._unsubDevices = undefined;
    }
    isWideListener.removeEventListener("change", this._isWideUpdated);
  }

  private _isWideUpdated = () => {
    this._isWide = isWideListener.matches;
  };

  private _handleUpdateAll() {
    if (
      this._isWide &&
      !confirm(`Do you wan to update ${this._updateCount} devices?`)
    ) {
      return;
    }
    openUpdateAllDialog();
  }

  private _handleEditSecrets() {
    openEditDialog("secrets.yaml");
  }

  private _handleOverflowAction(ev: CustomEvent<ActionDetail>) {
    switch (ev.detail.index) {
      case 0:
        this._handleUpdateAll();
        break;
      case 1:
        this._handleEditSecrets();
        break;
    }
  }

  static styles = css`
    esphome-button-menu {
      z-index: 1;
    }
    mwc-button {
      margin-left: 16px;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-header-menu": ESPHomeHeaderMenu;
  }
}
