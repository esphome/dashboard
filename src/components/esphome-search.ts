import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query } from "lit/decorators.js";
import { ESPHomeSearchInput } from "./esphome-search-input";
import "./esphome-search-input";


@customElement("esphome-search")
export class ESPHomeSearch extends LitElement {

  @query("esphome-search-input") private _textField!: ESPHomeSearchInput;

  protected override render(): TemplateResult {
    return html`
      <esphome-search-input
        label="Search"
        name="esphome-search"
        type="search"
        icon="search">
      </esphome-search-input>
    `;
  }

  static styles = [
    css`
      esphome-search-input {
        --mdc-theme-primary: var(--primary-text-color);
        width: 100vw;
      }
      .mdc-text-field__icon {
        color: var(--primary-text-color);
      }
    `
  ];

  public get value(): string {
    return this._textField?.value ? this._textField?.value : "";
  }

}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-search": ESPHomeSearch;
  }
}
