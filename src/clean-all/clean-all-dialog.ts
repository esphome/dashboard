import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import "../components/process-dialog";

@customElement("esphome-clean-all-dialog")
class ESPHomeCleanAllDialog extends LitElement {
  protected render() {
    return html`
      <esphome-process-dialog
        heading="Clean All Files"
        .type=${"clean-all"}
        .spawnParams=${{ clean_build_dir: true }}
        @closed=${this._handleClose}
      ></esphome-process-dialog>
    `;
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-clean-all-dialog": ESPHomeCleanAllDialog;
  }
}
