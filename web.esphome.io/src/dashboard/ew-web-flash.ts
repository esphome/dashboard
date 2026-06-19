import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@material/mwc-button";
import {
  openInstallWebDialog,
  preloadInstallWebDialog,
} from "../../../src/install-web";
import type { FileToFlash } from "../../../src/web-serial/flash";
import { esphomeDialogStyles } from "../../../src/styles";

// Message contract shared with the ESPHome Device Builder dashboard (the opener,
// on any http/https origin). The opener origin is unknown, so authentication is
// the one-time nonce plus an "is this my opener" source check, never an origin
// allowlist. The nonce travels one way only (opener to here); no outbound frame
// echoes it. Mirrors flasher/src/protocol.ts in the device-builder repo.
const PROTOCOL_VERSION = 1;
const MSG_READY = "esphome-web-flash:ready";
const MSG_FIRMWARE = "esphome-web-flash:firmware";
const MSG_STATE = "esphome-web-flash:state";

interface FirmwarePart {
  address: number;
  data: ArrayBuffer;
}

// install-web wants each image as a binary string (the same shape FileReader's
// readAsBinaryString produces); convert in chunks so a ~1MB factory image
// doesn't blow the argument limit of String.fromCharCode.
function bufferToBinaryString(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  let result = "";
  for (let i = 0; i < bytes.length; i += CHUNK) {
    result += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return result;
}

@customElement("ew-web-flash")
class EWWebFlash extends LitElement {
  @state() private _status: "waiting" | "ready" | "error" = "waiting";
  @state() private _name = "";
  @state() private _detail = "";
  @state() private _busy = false;

  private _nonce = "";
  private _opener: Window | null = null;
  // Stays '*' until the first valid inbound frame reveals the opener origin; no
  // outbound frame carries the nonce, so the pre-handoff broadcast leaks nothing.
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
      if (this._files || waited >= 10000) {
        this._stopReady();
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
    return html`
      <div class="card">
        <h2>Install over USB</h2>
        ${this._status === "error"
          ? html`<p class="error">${this._detail}</p>`
          : this._status === "waiting"
            ? html`<p>
                Waiting for firmware from ESPHome Device Builder&hellip;
              </p>`
            : html`
                <p>
                  Firmware
                  received${this._name
                    ? html` (<code>${this._name}</code>)`
                    : ""}.
                  Plug your device into this computer over USB, then connect and
                  install.
                </p>
                <mwc-button
                  raised
                  label="Connect & install"
                  .disabled=${this._busy}
                  @click=${this._install}
                ></mwc-button>
              `}
      </div>
    `;
  }

  private _stopReady(): void {
    if (this._readyTimer !== undefined) {
      clearInterval(this._readyTimer);
      this._readyTimer = undefined;
    }
  }

  private _post(message: object): void {
    this._opener?.postMessage(message, this._targetOrigin);
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
    if (!Array.isArray(data.parts) || data.parts.length === 0) {
      this._fail("Received a malformed firmware payload.");
      return;
    }
    if (this._targetOrigin === "*" && ev.origin && ev.origin !== "null") {
      this._targetOrigin = ev.origin;
    }
    this._stopReady();
    try {
      this._files = (data.parts as FirmwarePart[]).map((part) => ({
        data: bufferToBinaryString(part.data),
        address: part.address,
      }));
    } catch {
      this._fail("Could not read the firmware payload.");
      return;
    }
    this._erase = data.erase ?? true;
    this._name = typeof data.name === "string" ? data.name : "";
    this._status = "ready";
  };

  private _install = async (): Promise<void> => {
    if (!this._files || this._busy) return;
    this._busy = true;
    const files = this._files;
    let opened = false;
    await openInstallWebDialog(
      {
        erase: this._erase,
        filesCallback: async () => files,
        onClose: (success) => {
          this._busy = false;
          this._post({
            type: MSG_STATE,
            state: success ? "done" : "error",
            detail: success ? "" : "Installation did not complete.",
          });
        },
      },
      () => {
        opened = true;
      },
    );
    // Port picker dismissed or failed before the dialog opened: re-enable so the
    // user can try again (install-web's own no-port dialog also offers a retry).
    if (!opened) this._busy = false;
  };

  private _fail(detail: string): void {
    this._status = "error";
    this._detail = detail;
  }

  static styles = [
    esphomeDialogStyles,
    css`
      .card {
        margin: 40px auto;
        max-width: 450px;
        padding: 24px;
        border-radius: 12px;
        background: var(--card-background-color, #fff);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        text-align: center;
        color: var(--primary-text-color);
      }
      h2 {
        margin-top: 0;
      }
      code {
        word-break: break-all;
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
