import { css, html, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { TextFieldBase } from "@material/mwc-textfield/mwc-textfield-base";
import { styles } from "@material/mwc-textfield/mwc-textfield.css";
import "@material/mwc-icon";

@customElement("esphome-text-input")
export class ESPHomeTextInput extends TextFieldBase {
  protected override renderIcon(
    _icon: string,
    isTrailingIcon = false
  ): TemplateResult {
    const type = isTrailingIcon ? "trailing" : "leading";
    return html`
      <span
        class="mdc-text-field__icon mdc-text-field__icon--${type}"
        tabindex=${isTrailingIcon ? 1 : -1}
      >
        <mwc-icon tabindex="-1" class="prefix">${_icon}</mwc-icon>
      </span>
    `;
  }

  static override styles = [
    styles,
    css`
      .mdc-text-field__input {
        width: 100%;
      }
      .mdc-text-field:not(.mdc-text-field--disabled)
        .mdc-text-field__icon--leading {
        color: var(--primary-text-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-text-input": ESPHomeTextInput;
  }
}
