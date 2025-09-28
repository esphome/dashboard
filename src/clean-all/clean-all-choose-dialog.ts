import { LitElement, html, css } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-list/mwc-list-item.js";
import "@material/mwc-button";
import { metaChevronRight } from "../const";
import { esphomeDialogStyles, esphomeSvgStyles } from "../styles";
import { openCleanAllDialog } from "./index";

@customElement("esphome-clean-all-choose-dialog")
class ESPHomeCleanAllChooseDialog extends LitElement {
  protected render() {
    return html`
      <mwc-dialog
        open
        heading="What would you like to clean?"
        scrimClickAction
        @closed=${this._handleClose}
      >
        <mwc-list-item twoline hasMeta @click=${this._handleCleanAllConfig}>
          <span>Clean everything</span>
          <span slot="secondary">Remove all build and platform files</span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-list-item twoline hasMeta @click=${this._handleCleanAllNoConfig}>
          <span>Clean the platform</span>
          <span slot="secondary">Remove only the platform files</span>
          ${metaChevronRight}
        </mwc-list-item>

        <mwc-button
          no-attention
          slot="secondaryAction"
          dialogAction="close"
          label="Cancel"
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private _handleCleanAllConfig() {
    this._handleClose();
    openCleanAllDialog(true);
  }

  private _handleCleanAllNoConfig() {
    this._handleClose();
    openCleanAllDialog(false);
  }

  private _handleClose() {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  static styles = [
    esphomeDialogStyles,
    esphomeSvgStyles,
    css`
      mwc-dialog {
        --mdc-dialog-max-width: 500px;
      }
      mwc-list-item {
        margin: 0 -20px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-clean-all-choose-dialog": ESPHomeCleanAllChooseDialog;
  }
}
