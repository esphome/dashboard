import "./devices/devices-list";
import "./components/esphome-header-menu";
import { LitElement, html, PropertyValues, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { connectionStatus } from "./util/connection-status";
import { openWizardDialog } from "./wizard";
import "@material/mwc-button";
import { mdiHomeAutomation } from "@mdi/js";
import "./components/esphome-svg-icon";

@customElement("esphome-main")
class ESPHomeMainView extends LitElement {
  @property() version = "unknown";

  @property() docsLink = "";

  @property() logoutUrl?: string;

  @state() private editing?: string;

  @state() private showDiscoveredDevices = false;

  protected render() {
    if (this.editing) {
      return html`
        <style>
          esphome-editor {
            display: flex;
            flex-direction: column;
            flex: 1 0 auto;
          }
        </style>
        <esphome-editor
          @close=${this._handleEditorClose}
          fileName=${this.editing}
        ></esphome-editor>
      `;
    }
    return html`
      <header class="esphome-header">
        <div class="header-title">
          <esphome-svg-icon .path=${mdiHomeAutomation}></esphome-svg-icon>
          <span>ESPHome Device Builder</span>
        </div>
        <div class="flex"></div>
        <mwc-button
          raised
          class="create-device-btn"
          @click=${this._handleCreateDevice}
        >
          Create device
        </mwc-button>
        <esphome-header-menu
          .logoutUrl=${this.logoutUrl}
          .showDiscoveredDevices=${this.showDiscoveredDevices}
          @toggle-discovered-devices=${this._toggleDiscoveredDevices}
          @view-mode-changed=${this._handleViewModeChanged}
          @sort-changed=${this._handleSortChanged}
          @filter-changed=${this._handleFilterChanged}
        ></esphome-header-menu>
      </header>

      <main>
        <esphome-devices-list
          .showDiscoveredDevices=${this.showDiscoveredDevices}
          @toggle-discovered-devices=${this._toggleDiscoveredDevices}
        ></esphome-devices-list>
      </main>

      <footer class="page-footer">
        <div>
          ESPHome is a project by
          <a
            href="https://www.openhomefoundation.org/"
            target="_blank"
            rel="noreferrer"
            >Open Home Foundation</a
          >
          |
          <a href="https://esphome.io/guides/supporters.html" target="_blank"
            >Fund&nbsp;development</a
          >
          |
          <a href=${this.docsLink} target="_blank" rel="noreferrer"
            >${this.version} Documentation</a
          >
        </div>
      </footer>
    `;
  }
  createRenderRoot() {
    return this;
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    connectionStatus.initialize();
    document.body.addEventListener<any>("edit-file", (ev) => {
      this.editing = ev.detail;
    });
    import("./editor/esphome-editor");
  }

  private _handleEditorClose() {
    this.editing = undefined;
  }

  private _handleCreateDevice() {
    openWizardDialog();
  }

  private _toggleDiscoveredDevices() {
    this.showDiscoveredDevices = !this.showDiscoveredDevices;
  }

  private _handleViewModeChanged(e: CustomEvent) {
    // Forward event to devices list
    const devicesList = document.querySelector("esphome-devices-list");
    if (devicesList) {
      devicesList.dispatchEvent(
        new CustomEvent("view-mode-changed", { detail: e.detail }),
      );
    }
  }

  private _handleSortChanged(e: CustomEvent) {
    // Forward event to devices list
    const devicesList = document.querySelector("esphome-devices-list");
    if (devicesList) {
      devicesList.dispatchEvent(
        new CustomEvent("sort-changed", { detail: e.detail }),
      );
    }
  }

  private _handleFilterChanged(e: CustomEvent) {
    // Forward event to devices list
    const devicesList = document.querySelector("esphome-devices-list");
    if (devicesList) {
      devicesList.dispatchEvent(
        new CustomEvent("filter-changed", { detail: e.detail }),
      );
    }
  }

  static styles = css`
    :host {
      display: block;
      --primary-text-color: var(--mdc-theme-on-surface, #1d1d1d);
      --secondary-text-color: var(
        --mdc-theme-text-secondary-on-background,
        rgba(0, 0, 0, 0.54)
      );
      color: var(--primary-text-color);
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
      font-weight: 500;
    }
    .header-title esphome-svg-icon {
      --mdc-icon-size: 28px;
    }
    .create-device-btn {
      --mdc-theme-primary: #1e8e3e;
      --mdc-theme-on-primary: white;
      margin-right: 8px;
    }
    /* Global style for button menu icons */
    esphome-button-menu esphome-svg-icon {
      fill: var(--primary-text-color) !important;
      color: var(--primary-text-color) !important;
    }
    /* Target Material list items with icons */
    mwc-list-item[graphic="icon"] {
      --mdc-theme-text-primary-on-background: var(--primary-text-color);
    }
    /* Ensure SVG paths get the right color */
    esphome-svg-icon svg path {
      fill: currentColor;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-main": ESPHomeMainView;
  }
}
