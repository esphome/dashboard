import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-dialog";
import { esphomeDialogStyles } from "../styles";
import { copyToClipboard } from "../util/copy-clipboard";
import { openEditDialog } from "../editor";
import { getConfigurationApiKey } from "../api/configuration";

@customElement("esphome-show-api-key-dialog")
class ESPHomeShowApiKeyDialogDialog extends LitElement {
  @property() public configuration!: string;

  @state() private _apiKey?: string | null;

  @state() private _showCopied = false;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading=${`API key for ${this.configuration}`}
        scrimClickAction
        @closed=${this._handleClose}
      >
        ${this._apiKey === undefined
          ? "Loading…"
          : this._apiKey === null
          ? html`Unable to automatically extract API key. It may not be set.
              Open the configuration and look for <code>api:</code>.`
          : html`
              <div class="key" @click=${this._copyApiKey}>
                <code>${this._apiKey}</code>
                <mwc-button ?disabled=${this._showCopied}
                  >${this._showCopied ? "Copied!" : "Copy"}</mwc-button
                >
              </div>
            `}
        ${this._apiKey === null
          ? html`
              <mwc-button
                @click=${this._editConfig}
                no-attention
                slot="secondaryAction"
                dialogAction="close"
                label="Open configuration"
              ></mwc-button>
            `
          : ""}

        <mwc-button
          no-attention
          slot="primaryAction"
          dialogAction="close"
          label="Close"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);

    getConfigurationApiKey(this.configuration).then((key) => {
      this._apiKey = key;
    });
  }

  private _copyApiKey() {
    copyToClipboard(this._apiKey!);
    this._showCopied = true;
    setTimeout(() => (this._showCopied = false), 2000);
  }

  private _editConfig() {
    openEditDialog(this.configuration);
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [
    esphomeDialogStyles,
    css`
      .key {
        position: relative;
        display: flex;
        align-items: center;
      }
      code {
        word-break: break-all;
      }
      .key mwc-button {
        margin-left: 16px;
      }
      .copied {
        font-weight: bold;
        color: var(--alert-success-color);

        position: absolute;
        background-color: var(--mdc-theme-surface, #fff);
        padding: 10px;
        right: 0;
        font-size: 1.2em;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-show-api-key-dialog": ESPHomeShowApiKeyDialogDialog;
  }
}
