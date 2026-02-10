import { LitElement, html, css, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import { StreamError, streamLogs } from "../api";
import { ColoredConsole, coloredConsoleStyles } from "../util/console-color";
import { fireEvent } from "../util/fire-event";
import { esphomeDialogStyles } from "../styles";
import { textDownload } from "../util/file-download";

interface DeviceStatus {
  configuration: string;
  status: "pending" | "running" | "success" | "failed";
}

@customElement("esphome-update-selected-dialog")
class ESPHomeUpdateSelectedDialog extends LitElement {
  @property({ type: Array }) public configurations: string[] = [];

  @state() private _deviceStatuses: DeviceStatus[] = [];
  @state() private _currentIndex = 0;
  @state() private _isRunning = true;

  private _coloredConsole?: ColoredConsole;
  private _abortController?: AbortController;

  protected firstUpdated() {
    this._deviceStatuses = this.configurations.map((config) => ({
      configuration: config,
      status: "pending",
    }));

    const logContainer = this.shadowRoot!.querySelector(".log-container")!;
    this._coloredConsole = new ColoredConsole(logContainer as HTMLElement);

    this._runNextUpdate();
  }

  protected render() {
    const successCount = this._deviceStatuses.filter(
      (d) => d.status === "success",
    ).length;
    const failedCount = this._deviceStatuses.filter(
      (d) => d.status === "failed",
    ).length;
    const pendingCount = this._deviceStatuses.filter(
      (d) => d.status === "pending",
    ).length;

    return html`
      <mwc-dialog
        open
        heading="Install Selected (${this._currentIndex}/${this.configurations.length})"
        scrimClickAction
        @closed=${this._handleClose}
      >
        <div class="status-summary">
          <span class="status-badge pending" title="Pending">${pendingCount} pending</span>
          <span class="status-badge success" title="Success">${successCount} done</span>
          <span class="status-badge failed" title="Failed">${failedCount} failed</span>
        </div>

        <div class="device-list">
          ${this._deviceStatuses.map(
            (device) => html`<span class="device ${device.status}">${device.configuration}</span>`,
          )}
        </div>

        <div class="log-container log"></div>

        <mwc-button
          slot="secondaryAction"
          label="Download Logs"
          @click=${this._downloadLogs}
        ></mwc-button>

        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          .label=${this._isRunning ? "Stop" : "Close"}
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  private async _runNextUpdate() {
    if (this._currentIndex >= this.configurations.length) {
      this._isRunning = false;
      fireEvent(this, "update-selected-done");
      return;
    }

    const config = this.configurations[this._currentIndex];

    // Update status to running
    this._deviceStatuses = this._deviceStatuses.map((d, i) =>
      i === this._currentIndex ? { ...d, status: "running" as const } : d,
    );

    this._coloredConsole?.addLine(
      `\n\x1b[1;36m========== Installing ${config} (${this._currentIndex + 1}/${this.configurations.length}) ==========\x1b[0m\n`,
    );

    this._abortController = new AbortController();

    try {
      // First compile
      this._coloredConsole?.addLine(`\x1b[1;33mCompiling...\x1b[0m\n`);
      await streamLogs(
        "compile",
        { configuration: config },
        (line) => {
          this._coloredConsole?.addLine(line);
        },
        this._abortController,
      );

      // Then upload
      this._coloredConsole?.addLine(`\x1b[1;33mUploading...\x1b[0m\n`);
      await streamLogs(
        "upload",
        { configuration: config, port: "OTA" },
        (line) => {
          this._coloredConsole?.addLine(line);
        },
        this._abortController,
      );

      // Success
      this._deviceStatuses = this._deviceStatuses.map((d, i) =>
        i === this._currentIndex ? { ...d, status: "success" as const } : d,
      );
      this._coloredConsole?.addLine(
        `\x1b[1;32m✓ ${config} installed successfully\x1b[0m\n`,
      );
    } catch (error) {
      // Failed - continue to next device
      this._deviceStatuses = this._deviceStatuses.map((d, i) =>
        i === this._currentIndex ? { ...d, status: "failed" as const } : d,
      );
      const errorCode = error instanceof StreamError ? error.code : "unknown";
      this._coloredConsole?.addLine(
        `\x1b[1;31m✗ ${config} failed (exit code: ${errorCode})\x1b[0m\n`,
      );
    }

    this._currentIndex++;
    this.requestUpdate();

    // Continue with next device
    if (this._isRunning) {
      this._runNextUpdate();
    }
  }

  private _handleClose() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = undefined;
    }
    this._isRunning = false;
    this.parentNode!.removeChild(this);
  }

  private _downloadLogs() {
    const logs = this._coloredConsole?.logs() || "";
    textDownload(logs, "update_selected_logs.txt");
  }

  static styles = [
    esphomeDialogStyles,
    css`
      :host {
        --height-header-footer-padding: 152px;
      }
      mwc-dialog {
        --mdc-dialog-min-width: 95vw;
        --mdc-dialog-max-width: 95vw;
      }

      .status-summary {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 13px;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 500;
      }

      .status-badge::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .status-badge.pending {
        background: var(--secondary-background-color, #e0e0e0);
        color: var(--secondary-text-color, #666);
      }
      .status-badge.pending::before {
        background: var(--secondary-text-color, #999);
      }

      .status-badge.success {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .status-badge.success::before {
        background: #4caf50;
      }

      .status-badge.failed {
        background: #ffebee;
        color: #c62828;
      }
      .status-badge.failed::before {
        background: #f44336;
      }

      .device-list {
        font-size: 13px;
        line-height: 1.6;
        margin-bottom: 12px;
        color: var(--primary-text-color);
      }

      .device::before {
        margin-right: 2px;
      }

      .device:not(:last-child)::after {
        content: ", ";
      }

      .device.pending::before {
        content: "○";
        color: var(--secondary-text-color, #999);
      }

      .device.running::before {
        content: "◉";
        color: #2196f3;
      }

      .device.success::before {
        content: "✓";
        color: #4caf50;
      }

      .device.failed::before {
        content: "✗";
        color: #f44336;
      }

      .log-container {
        height: calc(60vh - var(--height-header-footer-padding));
        overflow: auto;
        background: #1c1c1c;
        border-radius: 4px;
        padding: 8px;
      }

      ${unsafeCSS(coloredConsoleStyles)}

      @media only screen and (max-width: 450px) {
        .log-container {
          height: calc(
            50vh - var(--height-header-footer-padding) - env(
                safe-area-inset-bottom
              )
          );
          margin-left: -24px;
          margin-right: -24px;
        }
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-update-selected-dialog": ESPHomeUpdateSelectedDialog;
  }
}
