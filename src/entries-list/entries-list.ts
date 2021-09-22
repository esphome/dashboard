import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import { getDashboardEntries, ListEntriesResult } from "../api/list-entries";
import { openWizardDialog } from "../wizard";
import "@material/mwc-button";
import "../components/esphome-button-menu";
import "../components/esphome-card";
import { subscribeOnlineStatus } from "../online_status";
import "./node-card";
import "./import-card";

@customElement("esphome-entries-list")
class ESPHomeEntriesList extends LitElement {
  @state() private _entries?: ListEntriesResult;
  @state() private _onlineStatus?: Record<string, boolean>;

  private _updateEntriesInterval?: number;
  private _nodeStatusUnsub?: () => void;

  protected render() {
    if (this._entries === undefined) {
      return html``;
    }
    if (
      this._entries.configured.length === 0 &&
      this._entries.importable.length === 0
    ) {
      return html`
        <div class="welcome-container">
          <h5>Welcome to ESPHome</h5>
          <p>It looks like you don't yet have any nodes.</p>
          <p>
            <mwc-button
              raised
              label="Add node"
              icon="add"
              @click=${openWizardDialog}
            ></mwc-button>
          </p>
        </div>
      `;
    }

    const importable = this._entries.importable;

    return html`
      <div class="container">
        ${importable.length
          ? html`
        <h5>Discovered ESPHome devices</h5>
        <div class="grid">
          ${importable.map(
            (entry) => html`
              <esphome-import-card
                .entry=${entry}
                @imported=${this._updateEntries}
              >
              </esphome-import-card>
            `
          )}
        </div>
        <hr></hr>
      `
          : ""}

        <div class="grid">
          ${this._entries.configured.map(
            (entry) => html` <esphome-node-card
              .entry=${entry}
              @deleted=${this._updateEntries}
              .onlineStatus=${(this._onlineStatus || {})[entry.filename]}
            >
            </esphome-node-card>`
          )}
        </div>
      </div>
    `;
  }

  static styles = css`
    .container {
      margin: 20px auto;
      width: 90%;
      max-width: 1920px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      grid-template-columns: 1fr 1fr 1fr;
      grid-column-gap: 1.5rem;
    }
    @media only screen and (max-width: 1100px) {
      .grid {
        grid-template-columns: 1fr 1fr;
        grid-column-gap: 1.5rem;
      }
    }
    @media only screen and (max-width: 750px) {
      .grid {
        grid-template-columns: 1fr;
        grid-column-gap: 0;
      }
    }
    esphome-node-card,
    esphome-import-card {
      margin: 0.5rem 0 1rem 0;
    }
    .welcome-container {
      text-align: center;
      margin-top: 40px;
    }
    h5 {
      font-size: 1.64rem;
      line-height: 110%;
      font-weight: 400;
      margin: 1rem 0 0.65rem 0;
    }
    hr {
      margin-top: 16px;
      margin-bottom: 16px;
    }
    mwc-button {
      --mdc-theme-primary: #4caf50;
    }
  `;

  private async _updateEntries() {
    this._entries = await getDashboardEntries();
  }

  public connectedCallback() {
    super.connectedCallback();
    const updateAndSchedule = async () => {
      await this._updateEntries();
      this._updateEntriesInterval = window.setInterval(async () => {
        await this._updateEntries();
      }, 5000);
    };
    updateAndSchedule();
    this._nodeStatusUnsub = subscribeOnlineStatus((res) => {
      this._onlineStatus = res;
    });
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    if (this._updateEntriesInterval) {
      window.clearInterval(this._updateEntriesInterval);
    }
    if (this._nodeStatusUnsub) {
      this._nodeStatusUnsub();
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-entries-list": ESPHomeEntriesList;
  }
}
