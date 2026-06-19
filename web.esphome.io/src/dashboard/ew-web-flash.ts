import { LitElement, html, css, nothing } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-button";
import "../../../src/components/esphome-card";
import {
  openInstallWebDialog,
  preloadInstallWebDialog,
} from "../../../src/install-web";
import type { FileToFlash } from "../../../src/web-serial/flash";
import { esphomeCardStyles } from "../../../src/styles";

// Message contract shared with the ESPHome Device Builder dashboard (the opener,
// on any http/https origin). The opener origin is unknown, so authentication is
// the one-time nonce plus an "is this my opener" source check, never an origin
// allowlist. The nonce travels one way only (opener to here); no outbound frame
// echoes it. Mirrors flasher/src/protocol.ts in the device-builder repo.
const PROTOCOL_VERSION = 1;
const MSG_READY = "esphome-web-flash:ready";
const MSG_FIRMWARE = "esphome-web-flash:firmware";
const MSG_STATE = "esphome-web-flash:state";
const MSG_PROGRESS = "esphome-web-flash:progress";

interface FirmwarePart {
  address: number;
  data: ArrayBuffer;
}

// install-web wants each image as a binary string (the byte-for-byte shape
// FileReader's readAsBinaryString produces): each byte maps to the code unit of
// the same value. Built in chunks so a ~1MB image doesn't blow the argument
// limit of String.fromCharCode. Do NOT use TextDecoder("latin1") here: per the
// Encoding spec that label is windows-1252, which remaps 0x80-0x9F and corrupts
// the firmware (checksum failure on boot).
function toBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let result = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    result += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return result;
}

// Validate the firmware payload before trusting its shape: each part must have a
// non-negative integer address and ArrayBuffer data. Mirrors isFlashParts in the
// device-builder flasher.
function isFlashParts(parts: unknown): parts is FirmwarePart[] {
  return (
    Array.isArray(parts) &&
    parts.length > 0 &&
    parts.every(
      (p) =>
        p &&
        typeof p === "object" &&
        typeof p.address === "number" &&
        Number.isInteger(p.address) &&
        p.address >= 0 &&
        p.data instanceof ArrayBuffer,
    )
  );
}

@customElement("ew-web-flash")
class EWWebFlash extends LitElement {
  @state() private _status: "waiting" | "ready" | "done" | "error" = "waiting";
  @state() private _name = "";
  @state() private _deviceName = "";
  @state() private _detail = "";
  @state() private _busy = false;

  private _nonce = "";
  private _opener: Window | null = null;
  // Seeded from the 'origin' hash param when the opener passes it, otherwise '*'
  // until the first valid inbound frame reveals the opener origin. No outbound
  // frame carries the nonce, so even the '*' broadcast leaks nothing.
  private _targetOrigin = "*";
  private _files: FileToFlash[] | null = null;
  private _erase = true;
  private _readyTimer?: number;

  connectedCallback(): void {
    super.connectedCallback();
    const params = new URLSearchParams(location.hash.slice(1));
    this._nonce = params.get("nonce") ?? "";
    this._targetOrigin = params.get("origin") || "*";
    this._opener = window.opener;
    if (!this._opener || !this._nonce) {
      this._status = "error";
      this._detail =
        "Open this page from ESPHome Device Builder to flash a device over USB.";
      return;
    }
    window.addEventListener("message", this._onMessage);
    preloadInstallWebDialog();
    // Re-announce until firmware arrives: a single 'ready' can race the opener
    // attaching its listener after window.open().
    this._sendReady();
    let waited = 0;
    this._readyTimer = window.setInterval(() => {
      waited += 500;
      if (this._files) {
        this._stopReady();
        return;
      }
      if (waited >= 10000) {
        // Opener crashed, navigated away, or speaks a mismatched protocol; give
        // the user a terminal state instead of an endless spinner.
        this._fail(
          "Didn't receive firmware. Return to ESPHome Device Builder and try the USB install again.",
        );
        return;
      }
      this._sendReady();
    }, 500);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("message", this._onMessage);
    this._stopReady();
  }

  protected render() {
    if (this._status === "done") {
      return html`<esphome-card status="DONE">
        <div class="card-header">
          ${this._deviceName
            ? html`Installed ${this._deviceName}`
            : "Install over USB"}
        </div>
        <div class="card-content">
          Installed and rebooting. You can close this tab, or
          <a href="${location.pathname}${location.search}">connect</a> to view
          the device logs.
        </div>
      </esphome-card>`;
    }
    return html`
      <esphome-card
        status=${this._status === "ready"
          ? "READY"
          : this._status === "error"
            ? "ERROR"
            : "WAITING"}
      >
        <div class="card-header">
          ${this._deviceName
            ? html`Install ${this._deviceName} over USB`
            : "Install over USB"}
        </div>
        <div class="card-content">
          ${this._status === "error"
            ? html`<span class="error">${this._detail}</span>`
            : this._status === "waiting"
              ? html`Waiting for firmware from ESPHome Device Builder&hellip;`
              : html`Firmware for
                  <b>${this._deviceName || "your device"}</b>
                  received${this._name
                    ? html` (<code>${this._name}</code>)`
                    : ""}.
                  Plug it into this computer over USB, then connect and install.`}
        </div>
        ${this._status === "ready"
          ? html`<div class="card-actions">
              <mwc-button
                label="Connect & install"
                .disabled=${this._busy}
                @click=${this._install}
              ></mwc-button>
            </div>`
          : nothing}
      </esphome-card>
    `;
  }

  private _stopReady(): void {
    if (this._readyTimer !== undefined) {
      clearInterval(this._readyTimer);
      this._readyTimer = undefined;
    }
  }

  private _post(message: object): void {
    try {
      this._opener?.postMessage(message, this._targetOrigin);
    } catch (err) {
      // A malformed origin from the hash makes postMessage throw; fall back to
      // '*' so the ready announcements keep flowing (no nonce travels outbound,
      // so the broader audience leaks nothing). Log rather than swallow so an
      // unrelated failure stays visible.
      console.error("postMessage failed; falling back to '*':", err);
      this._targetOrigin = "*";
      try {
        this._opener?.postMessage(message, "*");
      } catch (err2) {
        console.error("postMessage failed after origin fallback:", err2);
      }
    }
  }

  private _sendReady(): void {
    this._post({ type: MSG_READY, version: PROTOCOL_VERSION });
  }

  private _onMessage = (ev: MessageEvent): void => {
    // Only the window that opened us, and only with the matching nonce.
    if (!this._opener || ev.source !== this._opener) return;
    const data = ev.data;
    if (!data || data.type !== MSG_FIRMWARE || data.nonce !== this._nonce)
      return;
    if (this._files) return; // already handed off
    const parts = data.parts;
    if (!isFlashParts(parts)) {
      this._fail("Received a malformed firmware payload.");
      return;
    }
    if (this._targetOrigin === "*" && ev.origin && ev.origin !== "null") {
      this._targetOrigin = ev.origin;
    }
    this._stopReady();
    try {
      this._files = parts.map((part) => ({
        data: toBinaryString(part.data),
        address: part.address,
      }));
    } catch {
      this._fail("Could not read the firmware payload.");
      return;
    }
    this._erase = data.erase !== false;
    this._name = typeof data.name === "string" ? data.name : "";
    this._deviceName =
      typeof data.deviceName === "string" ? data.deviceName : "";
    // Identify the window in the browser tab so multiple flashes don't blur.
    if (this._deviceName) document.title = `Install ${this._deviceName}`;
    this._status = "ready";
  };

  private _install = async (): Promise<void> => {
    if (!this._files || this._busy) return;
    this._busy = true;
    const files = this._files;
    // Let install-web own the port: it requests + opens it (surfacing the "hold
    // BOOT" guidance on a chip-init failure) and, crucially, does NOT reopen it
    // after the flash since we pass no port; reopening a native-USB port after
    // the reset re-resets the chip into a boot loop. We don't need the port back
    // (logs are a separate fresh connect), mirroring the device-builder flasher.
    // "Erasing" until the first write progress arrives, then "Installing".
    let writing = false;
    await openInstallWebDialog({
      erase: this._erase,
      filesCallback: async () => files,
      // Mirror progress and the granular phase so the dashboard's install view
      // tracks this tab instead of showing a stale phase.
      onProgress: (pct) => {
        this._post({ type: MSG_PROGRESS, pct });
        if (!writing) {
          writing = true;
          this._post({
            type: MSG_STATE,
            state: "installing",
            detail: "Installing over USB…",
          });
        }
      },
      onStateChange: (state, error) => {
        if (state === "done") {
          this._post({
            type: MSG_STATE,
            state: error ? "error" : "done",
            detail: error ?? "",
          });
          return;
        }
        // Map install-web's phases to the mirror; onProgress flips to
        // "Installing" once the first write lands.
        if (state === "installing") {
          this._post({
            type: MSG_STATE,
            state: "installing",
            detail: "Erasing…",
          });
        } else if (state === "prepare_installation") {
          this._post({
            type: MSG_STATE,
            state: "installing",
            detail: "Preparing…",
          });
        } else {
          this._post({
            type: MSG_STATE,
            state: "connecting",
            detail: "Connecting to device…",
          });
        }
      },
      onClose: (success) => {
        this._busy = false;
        // Failed: stay on the card so the user can retry. Succeeded: done.
        this._status = success ? "done" : "ready";
      },
    });
  };

  private _fail(detail: string): void {
    this._stopReady(); // stop announcing ready once we're wedged
    this._status = "error";
    this._detail = detail;
  }

  static styles = [
    esphomeCardStyles,
    css`
      :host {
        display: block;
        max-width: 450px;
        margin: 40px auto;
      }
      esphome-card {
        --status-color: var(--alert-warning-color);
      }
      .card-actions mwc-button {
        --mdc-theme-primary: var(--alert-warning-color);
      }
      code {
        word-break: break-all;
      }
      a {
        color: inherit;
        text-decoration: underline;
      }
      .error {
        color: var(--alert-error-color);
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "ew-web-flash": EWWebFlash;
  }
}
