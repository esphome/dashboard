import { LitElement, html, css, unsafeCSS } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "@material/mwc-linear-progress";
import { streamLogs, StreamError } from "../api";
import { getDevices, canUpdateDevice } from "../api/devices";
import { ColoredConsole, coloredConsoleStyles } from "../util/console-color";
import { esphomeDialogStyles } from "../styles";
import { textDownload } from "../util/file-download";

/** Timeout for compile + upload per device (10 minutes) */
const DEVICE_UPDATE_TIMEOUT_MS = 10 * 60 * 1000;

/** Delay between verification retry attempts (10 seconds) */
const VERIFICATION_RETRY_DELAY_MS = 10 * 1000;

/** Maximum number of verification attempts */
const MAX_VERIFICATION_ATTEMPTS = 5;

interface DeviceResult {
  configuration: string;
  success: boolean | "pending";
  error?: string;
}

@customElement("esphome-update-online-dialog")
export class ESPHomeUpdateOnlineDialog extends LitElement {
  @property({ type: Array }) configurations: string[] = [];

  @state() private _currentIndex = 0;
  @state() private _isRunning = true;
  @state() private _isVerifying = false;
  @state() private _verifyingDevice = "";
  @state() private _verifyAttempt = 0;
  @state() private _results: DeviceResult[] = [];

  private _coloredConsole?: ColoredConsole;
  private _abortController?: AbortController;

  protected firstUpdated() {
    const logDiv = this.shadowRoot!.querySelector(".log") as HTMLDivElement;
    this._coloredConsole = new ColoredConsole(logDiv);
    this._startNextDevice();
  }

  private _getProgress(): number {
    // Progress is based on completed devices (those with results)
    if (this.configurations.length === 0) return 0;
    return this._results.length / this.configurations.length;
  }

  protected render() {
    const current = this.configurations[this._currentIndex];
    const successCount = this._results.filter((r) => r.success === true).length;
    const failCount = this._results.filter((r) => r.success === false).length;
    const pendingCount = this._results.filter(
      (r) => r.success === "pending",
    ).length;

    return html`
      <mwc-dialog
        open
        heading="Update Online Devices"
        scrimClickAction
        @closed=${this._handleClose}
      >
        <div class="status" aria-live="polite">
          ${this._isRunning
            ? html`
                <div class="current-device">
                  Updating: <strong>${current}</strong>
                  (${this._currentIndex + 1} of ${this.configurations.length})
                </div>
                <mwc-linear-progress .progress=${this._getProgress()}></mwc-linear-progress>
              `
            : this._isVerifying
              ? html`
                  <div class="current-device">
                    <strong>Verifying: ${this._verifyingDevice}</strong>
                    (attempt ${this._verifyAttempt} of ${MAX_VERIFICATION_ATTEMPTS})
                  </div>
                  <mwc-linear-progress indeterminate></mwc-linear-progress>
                `
              : html`
                  <div class="summary">
                    <strong>Complete!</strong>
                    ${successCount > 0
                      ? html`<span class="success"
                          >${successCount} verified</span
                        >`
                      : ""}
                    ${pendingCount > 0
                      ? html`<span class="unverified"
                          >${pendingCount} unverified</span
                        >`
                      : ""}
                    ${failCount > 0
                      ? html`<span class="failed">${failCount} failed</span>`
                      : ""}
                  </div>
                  <mwc-linear-progress .progress=${1}></mwc-linear-progress>
                  <div class="disclaimer">
                    Note: "Verified" means the device no longer needs an update.
                    "Unverified" means the upload completed but verification
                    failed.
                  </div>
                `}
        </div>

        <div class="log"></div>

        <mwc-button
          slot="secondaryAction"
          label="Download Logs"
          @click=${this._downloadLogs}
        ></mwc-button>

        <mwc-button
          slot="primaryAction"
          dialogAction="close"
          .label=${this._isRunning || this._isVerifying ? "Stop" : "Close"}
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  /**
   * Sleep for a specified duration, cancellable via AbortController.
   * @param ms - Duration in milliseconds
   * @returns Promise that resolves after delay or rejects if aborted
   */
  private _sleep(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, ms);
      this._abortController?.signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new Error("Aborted"));
      });
    });
  }

  private async _startNextDevice() {
    if (this._currentIndex >= this.configurations.length) {
      this._isRunning = false;
      // Check if we have any pending results that need verification
      const hasPending = this._results.some((r) => r.success === "pending");
      if (hasPending) {
        await this._verifyPendingDevices();
      }
      return;
    }

    const configuration = this.configurations[this._currentIndex];
    this._coloredConsole?.addLine(
      `\n\x1b[1;36m========== Updating ${configuration} (${this._currentIndex + 1}/${this.configurations.length}) ==========\x1b[0m\n`,
    );

    this._abortController = new AbortController();

    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        this._abortController?.abort();
        reject(new Error("Update timed out after 10 minutes"));
      }, DEVICE_UPDATE_TIMEOUT_MS);
    });

    // Step 1: Compile (socket closure = failure)
    this._coloredConsole?.addLine(`\x1b[1;33m>>> Compiling...\x1b[0m\n`);
    try {
      await Promise.race([
        streamLogs(
          "compile",
          { configuration },
          (line) => {
            this._coloredConsole?.addLine(line);
          },
          this._abortController,
        ),
        timeoutPromise,
      ]);
    } catch (error) {
      clearTimeout(timeoutId);
      const streamError = error as StreamError;
      this._results = [
        ...this._results,
        {
          configuration,
          success: false,
          error: `Compile failed: ${streamError.message}`,
        },
      ];
      this._coloredConsole?.addLine(
        `\x1b[1;31m✗ ${configuration} compile failed: ${streamError.message}\x1b[0m\n`,
      );
      this._currentIndex++;
      try {
        await this._sleep(500);
      } catch {
        return; // Aborted
      }
      if (!this.isConnected) return;
      this._startNextDevice();
      return;
    }

    // Step 2: Upload via OTA (socket closure = likely success)
    this._coloredConsole?.addLine(`\x1b[1;33m>>> Uploading via OTA...\x1b[0m\n`);
    try {
      await Promise.race([
        streamLogs(
          "upload",
          { configuration, port: "OTA" },
          (line) => {
            this._coloredConsole?.addLine(line);
          },
          this._abortController,
        ),
        timeoutPromise,
      ]);

      clearTimeout(timeoutId);
      this._results = [...this._results, { configuration, success: true }];
      this._coloredConsole?.addLine(
        `\x1b[1;32m✓ ${configuration} updated successfully\x1b[0m\n`,
      );
    } catch (error) {
      clearTimeout(timeoutId);
      const streamError = error as StreamError;
      // Socket closure during upload often means OTA completed successfully
      // Mark as pending for verification after all updates complete
      const isSocketClosure = streamError.message?.includes("socket closure");
      if (isSocketClosure) {
        this._results = [...this._results, { configuration, success: "pending" }];
        this._coloredConsole?.addLine(
          `\x1b[1;33m? ${configuration} upload completed (pending verification)\x1b[0m\n`,
        );
      } else {
        this._results = [
          ...this._results,
          {
            configuration,
            success: false,
            error: `Upload failed: ${streamError.message}`,
          },
        ];
        this._coloredConsole?.addLine(
          `\x1b[1;31m✗ ${configuration} upload failed: ${streamError.message}\x1b[0m\n`,
        );
      }
    }

    this._currentIndex++;
    this.requestUpdate();

    // Small delay before starting next device
    try {
      await this._sleep(500);
    } catch {
      return; // Aborted
    }
    if (!this.isConnected) return;
    this._startNextDevice();
  }

  private async _verifyPendingDevices() {
    this._isVerifying = true;
    this._abortController = new AbortController();

    const pendingConfigs = this._results
      .filter((r) => r.success === "pending")
      .map((r) => r.configuration);

    this._coloredConsole?.addLine(
      `\n\x1b[1;36m========== Verifying ${pendingConfigs.length} device(s) ==========\x1b[0m\n`,
    );

    for (
      this._verifyAttempt = 1;
      this._verifyAttempt <= MAX_VERIFICATION_ATTEMPTS;
      this._verifyAttempt++
    ) {
      const stillPending = this._results.filter((r) => r.success === "pending");
      if (stillPending.length === 0) {
        break;
      }

      if (this._verifyAttempt > 1) {
        this._coloredConsole?.addLine(
          `\x1b[1;33mWaiting 10 seconds before retry (attempt ${this._verifyAttempt}/${MAX_VERIFICATION_ATTEMPTS})...\x1b[0m\n`,
        );
        try {
          await this._sleep(VERIFICATION_RETRY_DELAY_MS);
        } catch {
          break; // Aborted
        }
        if (!this.isConnected) return;
      } else {
        this._coloredConsole?.addLine(
          `\x1b[1;33mChecking device status...\x1b[0m\n`,
        );
      }

      try {
        const devices = await getDevices();

        // Use immutable update for proper LitElement reactivity
        this._results = this._results.map((result) => {
          if (result.success !== "pending") return result;

          this._verifyingDevice = result.configuration;

          const device = devices.configured.find(
            (d) => d.configuration === result.configuration,
          );

          if (device && !canUpdateDevice(device)) {
            // Device no longer needs update = success
            this._coloredConsole?.addLine(
              `\x1b[1;32m✓ ${result.configuration} verified (no longer needs update)\x1b[0m\n`,
            );
            return { ...result, success: true as const };
          } else if (device && canUpdateDevice(device)) {
            // Device still needs update = failed
            this._coloredConsole?.addLine(
              `\x1b[1;31m✗ ${result.configuration} failed (still needs update)\x1b[0m\n`,
            );
            return {
              ...result,
              success: false as const,
              error: "Device still requires update after OTA",
            };
          } else {
            // Can't determine - keep as pending for retry
            this._coloredConsole?.addLine(
              `\x1b[1;33m? ${result.configuration} not yet online (will retry)\x1b[0m\n`,
            );
            return result;
          }
        });
      } catch (error) {
        this._coloredConsole?.addLine(
          `\x1b[1;31mVerification attempt failed: Could not fetch device status\x1b[0m\n`,
        );
        // Continue to retry
      }

      this.requestUpdate();
    }

    // Mark any remaining pending as unverified
    const finalPending = this._results.filter((r) => r.success === "pending");
    if (finalPending.length > 0) {
      this._coloredConsole?.addLine(
        `\x1b[1;33m${finalPending.length} device(s) could not be verified after ${MAX_VERIFICATION_ATTEMPTS} attempts\x1b[0m\n`,
      );
    }

    this._isVerifying = false;
    this._verifyingDevice = "";
    this.requestUpdate();
  }

  private _downloadLogs() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    textDownload(
      this._coloredConsole?.logs() || "",
      `update-online-${timestamp}.txt`,
    );
  }

  private _handleClose() {
    if (this._abortController) {
      this._abortController.abort();
    }
    this.parentNode!.removeChild(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._abortController) {
      this._abortController.abort();
    }
  }

  static styles = [
    esphomeDialogStyles,
    css`
      :host {
        --height-header-footer-padding: 180px;
      }
      mwc-dialog {
        --mdc-dialog-min-width: 95vw;
        --mdc-dialog-max-width: 95vw;
      }
      .status {
        margin-bottom: 16px;
      }
      .current-device {
        margin-bottom: 8px;
      }
      mwc-linear-progress {
        margin: 8px 0;
      }
      .summary {
        display: flex;
        gap: 16px;
        align-items: center;
      }
      .success {
        color: var(--status-connected, #4caf50);
      }
      .unverified {
        color: var(--alert-warning-color, #ff9800);
      }
      .failed {
        color: var(--alert-error-color, #f44336);
      }
      .disclaimer {
        margin-top: 8px;
        font-size: 12px;
        color: var(--secondary-text-color, #888);
        font-style: italic;
      }
      .log {
        height: calc(90vh - var(--height-header-footer-padding));
      }
      ${unsafeCSS(coloredConsoleStyles)}
      @media (max-width: 450px) {
        .log {
          height: calc(
            90vh - var(--height-header-footer-padding) - env(
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
    "esphome-update-online-dialog": ESPHomeUpdateOnlineDialog;
  }
}
