import { css, html, LitElement, TemplateResult } from "lit";
import { property, state, customElement } from "lit/decorators.js";
import "@material/mwc-button";
import { supportsWebSerial } from "../../../src/const";

const isWideListener = window.matchMedia("(min-width: 601px)");

@customElement("ew-header-menu")
export class EWHeaderMenu extends LitElement {
  @property({ type: String, attribute: "logout-url" }) logoutUrl?: string;

  @state() private _isWide = isWideListener.matches;

  @state() private _pico = false;

  protected render(): TemplateResult {
    if (!supportsWebSerial) {
      return html``;
    }
    return html`
      <a href=${this._pico ? "/" : "/?pico"}>
        <mwc-button
          icon="arrow_forward"
          .label=${!this._isWide
            ? ""
            : this._pico
            ? "ESP device"
            : "Raspberry Pi"}
        >
          <img
            src=${`static_web/logo/${
              this._pico ? "espressif" : "raspberry"
            }.png`}
          />
        </mwc-button>
      </a>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    isWideListener.addEventListener("change", this._isWideUpdated);
    this._pico = new URLSearchParams(location.search).has("pico");
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    isWideListener.removeEventListener("change", this._isWideUpdated);
  }

  private _isWideUpdated = () => {
    this._isWide = isWideListener.matches;
  };

  static styles = css`
    mwc-button {
      --mdc-theme-primary: black;
      margin-left: 16px;
      line-height: 1em;
    }
    mwc-button img {
      height: 32px;
      margin-left: 3px;
      margin-right: -8px;
    }
    a {
      text-decoration: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-header-menu": EWHeaderMenu;
  }
}
