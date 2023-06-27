import { css, html, LitElement, PropertyValues, TemplateResult } from "lit";
import { customElement, state, query } from "lit/decorators.js";
import { ESPHomeTextInput } from "./esphome-text-input";
import "./esphome-text-input";

@customElement("esphome-search")
export class ESPHomeSearch extends LitElement {
  @state() public show = false;

  @query("esphome-text-input") private _textField!: ESPHomeTextInput;

  protected override render(): TemplateResult {
    if (!this.show) {
      return html``;
    }
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
    if (!this.show) return "";
    return this._textField?.value ? this._textField?.value : "";
  }

  private _inputEvent() {
    const event = new InputEvent("input");
    this.dispatchEvent(event);
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    document.body.addEventListener<any>("toggle-search", () => {
      this.show = !this.show;
      if (!this.show) this._inputEvent();
      else setTimeout(() => this._textField?.focus(), 100);
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-search": ESPHomeSearch;
  }
}
