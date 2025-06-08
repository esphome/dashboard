import "./devices/devices-list";
import "./components/esphome-header-menu";
import "./components/esphome-fab";
import { LitElement, html, PropertyValues, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

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
        <img src="static/images/logo-text.svg" alt="ESPHome Logo" />
        <div class="flex"></div>
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

      <esphome-fab></esphome-fab>

      <footer class="page-footer">
        <div>
          ESPHome by Open Home Foundation |
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
    document.body.addEventListener<any>("edit-file", (ev) => {
      this.editing = ev.detail;
    });
    import("./editor/esphome-editor");
  }

  private _handleEditorClose() {
    this.editing = undefined;
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
      --secondary-text-color: var(--mdc-theme-text-secondary-on-background, rgba(0, 0, 0, 0.54));
      color: var(--primary-text-color);
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
