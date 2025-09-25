import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import "../components/process-dialog";

@customElement("esphome-clean-all-dialog")
class ESPHomeCleanAllDialog extends LitElement {
  @property({ type: Boolean }) cleanBuildDir = true;

  protected render() {
    return html`
      <esphome-process-dialog
        heading="Clean All"
        .type=${"clean-all"}
        .spawnParams=${{ clean_build_dir: this.cleanBuildDir }}
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
