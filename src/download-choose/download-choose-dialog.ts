import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "@material/mwc-circular-progress";
import "@material/mwc-button";
import { metaChevronRight } from "../const";
import { openCompileDialog } from "../compile";
import { esphomeDialogStyles } from "../styles";
import { textDownload } from "../util/file-download";
import { getFile } from "../api/files";

const ESPHOME_WEB_URL = "https://web.esphome.io/?dashboard_install";

@customElement("esphome-download-choose-dialog")
class ESPHomeDownloadChooseDialog extends LitElement {
  @property() public configuration!: string;

  protected render() {
    return html`
      <mwc-dialog
        open
        .heading=${this.configuration}
        @closed=${this._handleClose}
      >
        <mwc-list-item
          twoline
          hasMeta
          dialogAction="close"
          @click=${this._handleYamlDownload}
        >
          <span>Download YAML</span>
          <span slot="secondary">
            Download as local backup or share with friends and family
          </span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item
          twoline
          hasMeta
          dialogAction="close"
          @click=${this._handleWebDownload}
        >
          <span>Download compiled binary</span>
          <span slot="secondary">
            To install using ESPHome Web and other tools.
          </span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item
          twoline
          hasMeta
          dialogAction="close"
          @click=${this._handleManualDownload}
        >
          <span>Download compiled binary (legacy format)</span>
          <span slot="secondary">For use with ESPHome Flasher.</span>
          ${metaChevronRight}
        </mwc-list-item>

        <a
          href=${ESPHOME_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="bottom-left"
          >Open ESPHome Web</a
        >
        <mwc-button
          no-attention
          slot="secondaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleYamlDownload() {
    getFile(this.configuration).then((config) => {
      textDownload(config!, this.configuration);
    });
  }

  private _handleManualDownload() {
    openCompileDialog(this.configuration, false);
  }

  private _handleWebDownload() {
    openCompileDialog(this.configuration, true);
  }

  private async _handleClose() {
    this.parentNode!.removeChild(this);
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
      a.bottom-left {
        z-index: 1;
        position: absolute;
        line-height: 36px;
        bottom: 9px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-download-choose-dialog": ESPHomeDownloadChooseDialog;
  }
}
