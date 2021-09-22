import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { ImportableEntry, importEntry } from "../api/list-entries";
import "@material/mwc-button";
import "../components/esphome-card";
import { fireEvent } from "../util/fire-event";

@customElement("esphome-import-card")
class ESPHomeImportCard extends LitElement {
  @property() public entry!: ImportableEntry;

  protected render() {
    return html`
      <esphome-card>
        <div class="card-header">${this.entry.name}</div>
        <div class="card-content">${this.entry.project_name}</div>

        <div class="card-actions">
          <mwc-button label="Import" @click=${this._handleImport}></mwc-button>
        </div>
      </esphome-card>
    `;
  }

  static styles = css`
    .card-actions {
      padding: 4px;
    }
    mwc-button {
      --mdc-theme-primary: #ffab40;
    }
  `;

  private async _handleImport() {
    await importEntry(this.entry);
    fireEvent(this, "imported");
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-import-card": ESPHomeImportCard;
  }
}
