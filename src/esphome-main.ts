import "./devices/devices-list";
import "./components/esphome-header-menu";
import "./components/esphome-fab";
import { LitElement, html, PropertyValues } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { connectionStatus } from "./util/connection-status";

@customElement("esphome-main")
class ESPHomeMainView extends LitElement {
  @property() version = "unknown";

  @property() docsLink = "";

  @property() logoutUrl?: string;

  @state() private editing?: string;

  @state() private showDiscoveredDevices = false;

  @state() private _selectedCount = 0;

  @state() private _selectedConfigurations: string[] = [];

  @query("esphome-devices-list") private _devicesList?: HTMLElement;

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
          .selectedCount=${this._selectedCount}
          .selectedConfigurations=${this._selectedConfigurations}
          @toggle-discovered-devices=${this._toggleDiscoveredDevices}
          @update-selected-started=${this._clearSelection}
        ></esphome-header-menu>
      </header>

      <main>
        <esphome-devices-list
          .showDiscoveredDevices=${this.showDiscoveredDevices}
          @toggle-discovered-devices=${this._toggleDiscoveredDevices}
          @selection-changed=${this._handleSelectionChanged}
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
    connectionStatus.initialize();
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

  private _handleSelectionChanged(
    e: CustomEvent<{ count: number; configurations: string[] }>,
  ) {
    this._selectedCount = e.detail.count;
    this._selectedConfigurations = e.detail.configurations;
  }

  private _clearSelection() {
    this._selectedCount = 0;
    this._selectedConfigurations = [];
    if (this._devicesList) {
      (this._devicesList as any).clearSelection();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-main": ESPHomeMainView;
  }
}
