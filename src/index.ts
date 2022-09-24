import "./devices/devices-list";
import "./components/esphome-header-menu";
import "./components/esphome-fab";
import { LitElement, html, PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";

const esphome_globals: {
  version: string;
  docs_link: string;
  logoutUrl: string;
} = (window as any).esphome_globals;

@customElement("esphome-main")
class ESPHomeMainView extends LitElement {
  @state() private editing?: string;

  protected render() {
    if (this.editing) {
      return html`<style>
          esphome-editor {
            display: flex;
            flex-direction: column;
            flex: 1 0 auto;
          }
        </style>
        <esphome-editor
          @close=${this._handleEditorClose}
          fileName=${this.editing}
        ></esphome-editor>`;
    }
    return html`
      <main>
        <esphome-devices-list></esphome-devices-list>
      </main>
      <div class="esphome-header">
        <img
          src="https://esphome.io/_static/logo-text.svg"
          alt="ESPHome Logo"
        />
        <div class="flex"></div>
        <esphome-header-menu
          logout-url="${esphome_globals.logoutUrl}"
        ></esphome-header-menu>
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
            <a
              href="${esphome_globals.docs_link}"
              target="_blank"
              rel="noreferrer"
              >v${esphome_globals.version} Documentation</a
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
    document.body.addEventListener("edit-file", (e) =>
      this._handleEdit(e as CustomEvent<string>)
    );
    import("./editor/esphome-editor");
  }

  private _handleEdit(ev: { detail: string }) {
    this.editing = ev.detail;
  }

  private _handleEditorClose() {
    this.editing = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-main": ESPHomeMainView;
  }
}
