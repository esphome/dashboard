import "./devices/devices-list";
import "./components/esphome-header-menu";
import "./components/esphome-fab";
import { LitElement, html, PropertyValues } from "lit";
import { customElement, state } from "lit/decorators.js";

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
    return html` <esphome-devices-list></esphome-devices-list>
      <esphome-fab></esphome-fab>`;
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
