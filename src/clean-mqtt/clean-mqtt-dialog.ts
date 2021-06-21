import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@material/mwc-button";
import "../components/remote-process";
import "../components/process-dialog";

@customElement("esphome-clean-mqtt-dialog")
class ESPHomeCleanMQTTDialog extends LitElement {
  @property() public configuration!: string;

  protected render() {
    return html`
      <esphome-process-dialog
        .heading=${`Clean MQTT discovery topics for ${this.configuration}`}
        .type=${"clean-mqtt"}
        .spawnParams=${{ configuration: this.configuration }}
        @closed=${this._handleClose}
      >
      </esphome-process-dialog>
    `;
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-clean-mqtt-dialog": ESPHomeCleanMQTTDialog;
  }
}
