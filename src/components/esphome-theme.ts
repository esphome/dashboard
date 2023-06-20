import { html, LitElement, PropertyValues, TemplateResult } from "lit";
import { property, state, customElement } from "lit/decorators.js";
import "@material/mwc-icon-button";
import "@material/mwc-button";
import "@material/mwc-list/mwc-list-item";

const darkQuery: MediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");

@customElement("esphome-theme")
export class ESPHomeTheme extends LitElement {
  @property({ type: String, attribute: "display-type" }) displayType?: string;
  @property({ type: String, attribute: "display-text" }) displayText?: string;
  @state() private _theme = darkQuery.matches ? "Dark" : "Light";

  firstUpdated(changedProperties: PropertyValues) {
    super.firstUpdated(changedProperties);
    if (localStorage.getItem("theme")) {
      this._theme = localStorage.getItem("theme") as string;
    }
    document.documentElement.setAttribute("data-theme", this._theme);
    darkQuery.addEventListener("change", () => {
      if (!localStorage.getItem("theme")) {
        this._theme = darkQuery.matches ? "Dark" : "Light";
        document.documentElement.setAttribute("data-theme", this._theme);
      }
    });
  }

  protected render(): TemplateResult {
    if (this.displayType === "list-item") {
      return html`<mwc-list-item @click=${this._handleToggleTheme}>${this._getDispayText()}</mwc-list-item>`;
    }
    return html`
    <mwc-button
      icon="settings_brightness"
      label="${this._getDispayText()}"
      @click=${this._handleToggleTheme}
      data-dt=${this.displayText}
    ></mwc-button>`;
  }

  private _getDispayText() {
    if (this.displayText === "false") {
      return "";
    }
    return (this._theme === "Dark" ? "Light" : "Dark") + " Theme";
  }

  private _handleToggleTheme() {
    this._theme = this._theme === "Dark" ? "Light" : "Dark";
    document.documentElement.setAttribute("data-theme", this._theme);
    localStorage.setItem("theme", this._theme);
  }

}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-theme": ESPHomeTheme;
  }
}
