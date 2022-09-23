import "./devices/devices-list";
import "./components/esphome-header-menu";
import "./components/esphome-fab";
import "./editor/esphome-editor";
import { LitElement, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { editCallback } from "./editor";

@customElement("esphome-main")
class ESPHomeMainView extends LitElement {
  @state() private editing?: string;
  constructor() {
    super();
    editCallback.callback = (configuration: string) => {
      this.editing = configuration;
    };
  }

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
    return html`<esphome-devices-list @edit=${this._handleEdit}>
      </esphome-devices-list>
      <esphome-fab></esphome-fab>`;
  }
  createRenderRoot() {
    return this;
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
