import "./devices/devices-list";
import "./components/esphome-header-menu";
import "./components/esphome-fab";
import { LitElement, html, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import ViewMode from "./devices/viewMode"

const isWideListener = window.matchMedia("(min-width: 655px)");

@customElement("esphome-main")
class ESPHomeMainView extends LitElement {
  @property() version = "unknown";

  @property() docsLink = "";

  @property() logoutUrl?: string;

  @state() private editing?: string;

  @state() private viewMode: ViewMode = Number(localStorage.getItem('esphome_viewmode')) || ViewMode.Module;

  @state() private _isWide = isWideListener.matches;

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
      <main>
        <esphome-devices-list .viewMode=${this._isWide ? this.viewMode : ViewMode.Module}></esphome-devices-list>
      </main>
      <div class="esphome-header">
        <img
          src="https://esphome.io/_static/logo-text.svg"
          alt="ESPHome Logo"
        />
        <div class="flex"></div>
        <esphome-header-menu .logoutUrl=${this.logoutUrl} @toggle-view-mode=${this._toggleViewMode} .viewMode=${this.viewMode}></esphome-header-menu>
      </div>
      <esphome-fab></esphome-fab>
      <footer class="page-footer grey darken-4">
        <div class="container">
          <div class="left">
            ESPHome by Nabu Casa |
            <a href="https://esphome.io/guides/supporters.html" target="_blank"
              >Fund development</a
            >
            |
            <a href=${this.docsLink} target="_blank" rel="noreferrer"
              >v${this.version} Documentation</a
            >
          </div>
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

  private _toggleViewMode() {
    if (this.viewMode === ViewMode.Module) {
      this.viewMode = ViewMode.List
    } else {
      this.viewMode = ViewMode.Module
    }
    localStorage.setItem('esphome_viewmode', this.viewMode.toString())
  }

  connectedCallback() {
    super.connectedCallback();
    isWideListener.addEventListener("change", this._isWideUpdated);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    isWideListener.removeEventListener("change", this._isWideUpdated);
  }

  private _isWideUpdated = () => {
    this._isWide = isWideListener.matches;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-main": ESPHomeMainView;
  }
}
