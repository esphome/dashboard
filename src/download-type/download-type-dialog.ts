import { LitElement, html, PropertyValues, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
import { metaChevronRight } from "../const";
import { esphomeDialogStyles } from "../styles";
import "../components/esphome-alert";
import {
  DownloadType,
  getDownloadTypes,
  getDownloadUrl,
} from "../api/download";

@customElement("esphome-download-type-dialog")
class ESPHomeDownloadTypeDialog extends LitElement {
  @property() public configuration!: string;
  @property() public platformSupportsWebSerial!: boolean;

  @state() private _error?: string;
  @state() private _downloadTypes?: DownloadType[];

  protected render() {
    let heading;
    let content;

    heading = "What version do you want to download?";
    content = html`
      ${this._error ? html`<div class="error">${this._error}</div>` : ""}
      ${!this._downloadTypes
        ? html`<div>Checking files to download...</div>`
        : html`
            ${this._downloadTypes.map(
              (type) => html`
                <mwc-list-item
                  twoline
                  hasMeta
                  dialogAction="close"
                  @click=${() => this._handleDownload(type)}
                >
                  <span>${type.title}</span>
                  <span slot="secondary">${type.description}</span>
                  ${metaChevronRight}
                </mwc-list-item>
              `
            )}
          `}
    `;

    return html`
      <mwc-dialog open heading=${heading} scrimClickAction>
        ${content}
        ${this.platformSupportsWebSerial
          ? html`
              <a
                href="https://web.esphome.io"
                target="_blank"
                rel="noopener noreferrer"
                class="bottom-left"
                >Open ESPHome Web</a
              >
            `
          : ""}

        <mwc-button
          no-attention
          slot="primaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    getDownloadTypes(this.configuration)
      .then((types) => {
        if (types.length == 1) {
          this._handleDownload(types[0]);
          this._close();
          return;
        }
        this._downloadTypes = types;
      })
      .catch((err: any) => {
        this._error = err.message || err;
      });
  }

  private _handleDownload(type: DownloadType) {
    const link = document.createElement("a");
    link.download = type.download;
    link.href = getDownloadUrl(this.configuration, type);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private _close() {
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }

  static styles = [
    esphomeDialogStyles,
    css`
      mwc-list-item {
        margin: 0 -20px;
      }
      svg {
        fill: currentColor;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-download-type-dialog": ESPHomeDownloadTypeDialog;
  }
}
