import "./devices/devices-list";
import "./components/esphome-header-menu";
import "./components/esphome-fab";
import { LitElement, html, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("esphome-main")
class ESPHomeMainView extends LitElement {
  @property() version = "unknown";

  @property() docsLink = "";

  @property() logoutUrl?: string;

  private url = new URL(document.baseURI);
  @state() private editing?: string =
    this.url.searchParams.get("edit") || undefined;

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
        <esphome-header-menu .logoutUrl=${this.logoutUrl}></esphome-header-menu>
      </header>

      <main>
        <esphome-devices-list></esphome-devices-list>
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
      this.url.searchParams.set("edit", ev.detail);
      window.history.pushState({}, "", this.url.toString());
      this.editing = ev.detail;
    });

    window.addEventListener("popstate", () => {
      const url = new URL(document.baseURI);
      const editing = url.searchParams.get("edit") || undefined;
      this.editing = editing;
    });

    import("./editor/esphome-editor");
  }

  private _handleEditorClose() {
    this.url.searchParams.delete("edit");
    window.history.pushState({}, "", this.url.toString());
    this.editing = undefined;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-main": ESPHomeMainView;
  }
}
