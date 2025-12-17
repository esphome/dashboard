import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-menu";
import "@material/mwc-list/mwc-list-item";
import "@material/mwc-icon-button";
import {
  getLocale,
  setLocale,
  getAvailableLocales,
  LocaleCode,
  onLocaleChange,
} from "../locales";

/**
 * Language selector component for ESPHome Dashboard
 * Allows users to switch between available languages
 */
@customElement("esphome-language-selector")
export class ESPHomeLanguageSelector extends LitElement {
  @state() private _currentLocale: LocaleCode = getLocale();
  @state() private _menuOpen = false;

  private _unsubscribe?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this._unsubscribe = onLocaleChange((locale) => {
      this._currentLocale = locale;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unsubscribe?.();
  }

  protected render() {
    const locales = getAvailableLocales();
    const currentLocaleData = locales.find(
      (l) => l.code === this._currentLocale
    );

    return html`
      <div class="language-selector">
        <mwc-icon-button
          icon="language"
          @click=${this._toggleMenu}
          title="${currentLocaleData?.nativeName || "Language"}"
        ></mwc-icon-button>
        <mwc-menu
          .open=${this._menuOpen}
          @closed=${this._handleMenuClosed}
          corner="BOTTOM_START"
        >
          ${locales.map(
            (locale) => html`
              <mwc-list-item
                ?selected=${locale.code === this._currentLocale}
                @click=${() => this._selectLocale(locale.code)}
              >
                <span class="locale-name">${locale.nativeName}</span>
                ${locale.code === this._currentLocale
                  ? html`<mwc-icon slot="meta">check</mwc-icon>`
                  : ""}
              </mwc-list-item>
            `
          )}
        </mwc-menu>
      </div>
    `;
  }

  private _toggleMenu() {
    this._menuOpen = !this._menuOpen;
  }

  private _handleMenuClosed() {
    this._menuOpen = false;
  }

  private _selectLocale(locale: LocaleCode) {
    setLocale(locale);
    this._menuOpen = false;
    // Force page reload to apply translations
    window.location.reload();
  }

  static styles = css`
    :host {
      display: inline-block;
    }

    .language-selector {
      position: relative;
    }

    mwc-icon-button {
      --mdc-icon-button-size: 40px;
      --mdc-theme-text-icon-on-background: var(--primary-text-color);
    }

    mwc-menu {
      --mdc-menu-min-width: 150px;
    }

    .locale-name {
      text-transform: capitalize;
    }

    mwc-list-item[selected] {
      --mdc-theme-primary: var(--primary-color);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-language-selector": ESPHomeLanguageSelector;
  }
}
