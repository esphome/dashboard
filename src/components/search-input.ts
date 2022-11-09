import "@material/mwc-textfield";
import { mdiClose, mdiMagnify } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import { fireEvent } from "../util/fire-event";
import "./esphome-svg-icon";
import { ESPHomeTextField } from "./esphome-textfield";
import "./esphome-textfield";
import "./esphome-icon-button";

@customElement("search-input")
class SearchInput extends LitElement {
  @property() public filter?: string;

  @property({ type: Boolean })
  public suffix = false;

  @property({ type: Boolean })
  public autofocus = false;

  @property({ type: String })
  public label?: string;

  public focus() {
    this._input?.focus();
  }

  @query("esphome-textfield", true) private _input!: ESPHomeTextField;

  protected render(): TemplateResult {
    return html`
      <esphome-textfield
        .autofocus=${this.autofocus}
        .label=${this.label || "Search"}
        .value=${this.filter || ""}
        icon
        .iconTrailing=${this.filter || this.suffix}
        @input=${this._filterInputChanged}
      >
        <slot name="prefix" slot="leadingIcon">
          <esphome-svg-icon
            tabindex="-1"
            class="prefix"
            .path=${mdiMagnify}
          ></esphome-svg-icon>
        </slot>
        <div class="trailing" slot="trailingIcon">
          ${this.filter &&
          html`
            <esphome-icon-button
              @click=${this._clearSearch}
              .path=${mdiClose}
              class="clear-button"
            ></esphome-icon-button>
          `}
          <slot name="suffix"></slot>
        </div>
      </esphome-textfield>
    `;
  }

  private async _filterChanged(value: string) {
    fireEvent(this, "value-changed", { value: String(value) });
  }

  private async _filterInputChanged(e: { target: { value: string } }) {
    this._filterChanged(e.target.value);
  }

  private async _clearSearch() {
    this._filterChanged("");
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: inline-flex;
      }
      .clear-button {
        --mdc-icon-size: 20px;
      }
      esphome-textfield {
        display: inherit;
      }
      .trailing {
        display: flex;
        align-items: center;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "search-input": SearchInput;
  }
}
