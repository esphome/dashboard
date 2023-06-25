import { css, html, LitElement, TemplateResult } from "lit";
import { customElement, query } from "lit/decorators.js";
import { ESPHomeTextInput } from "./esphome-text-input";
import "./esphome-text-input";

@customElement("esphome-search")
export class ESPHomeSearch extends LitElement {
  @query("esphome-text-input") private _textField!: ESPHomeTextInput;

  protected override render(): TemplateResult {
    return html`
      <esphome-text-input
        label="Search"
        name="esphome-search"
        type="search"
        icon="search"
        @input=${this._inputEvent}
      >
      </esphome-text-input>
    `;
  }

  static styles = [
    css`
      esphome-text-input {
        --mdc-theme-primary: var(--primary-text-color);
        width: 100vw;
      }
      .mdc-text-field__icon {
        color: var(--primary-text-color);
      }
    `,
  ];

  public get value(): string {
    return this._textField?.value ? this._textField?.value : "";
  }

  private _inputEvent() {
    const event = new InputEvent("input");
    this.dispatchEvent(event);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-search": ESPHomeSearch;
  }
}
