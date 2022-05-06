import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property, query, state } from "lit/decorators.js";
import "@material/mwc-button";
import "@material/mwc-textfield";
import type { TextField } from "@material/mwc-textfield";
import "@material/mwc-dialog";
import { esphomeDialogStyles } from "../styles";
import { getConfiguration } from "../api/configuration";

@customElement("esphome-rename-dialog")
class ESPHomeRenameDialog extends LitElement {
  @property() public configuration!: string;

  public suggestedName!: string;

  @state() private _error?: string;

  @query("mwc-textfield[name=name]") private _inputName!: TextField;

  protected render() {
    return html`
      <mwc-dialog
        open
        heading=${`Rename ${this.configuration}`}
        scrimClickAction
        @closed=${this._handleClose}
      >
        ${this._error ? html`<div class="error">${this._error}</div>` : ""}

        <mwc-textfield
          label="Name"
          name="name"
          required
          dialogInitialFocus
          pattern="^[a-z0-9-]+$"
          helper="Lowercase letters (a-z), numbers (0-9) or dash (-)"
          @input=${this._cleanNameInput}
          @blur=${this._cleanNameBlur}
        ></mwc-textfield>

        <mwc-button
          no-attention
          slot="secondaryAction"
          dialogAction="close"
          label="Close"
        ></mwc-button>
        <mwc-button
          slot="primaryAction"
          label="Rename"
          @click=${this._handleRename}
        ></mwc-button>
      </mwc-dialog>
    `;
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    const input = this._inputName;
    input.value = this.suggestedName;
  }

  private _cleanNameInput = (ev: InputEvent) => {
    this._error = undefined;
    const input = ev.target as TextField;
    input.value = input.value
      // Convert uppercase to lower
      .toLowerCase()
      // Replace seperator characters with -
      .replace(/[ \._]/g, "-")
      // Remove the rest
      .replace(/[^a-z0-9-]/g, "");
  };

  private _cleanNameBlur = (ev: Event) => {
    const input = ev.target as TextField;
    // Remove starting and trailing -
    input.value = input.value.replace(/^-+/, "").replace(/-+$/, "");
  };

  private async _handleRename(ev: Event) {
    const processDialogImport = import("./rename-process-dialog");

    const nameInput = this._inputName;

    const nameValid = nameInput.reportValidity();

    if (!nameValid) {
      nameInput.focus();
      return;
    }

    const name = nameInput.value;

    try {
      await getConfiguration(`${name}.yaml`);
      this._error = "Name already in use";
      return;
    } catch (err) {
      // This is expected.
    }

    const mod = await processDialogImport;
    mod.openRenameProcessDialog(this.configuration, name);
    this.shadowRoot!.querySelector("mwc-dialog")!.close();
  }

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  static styles = [
    esphomeDialogStyles,
    css`
      .error {
        color: var(--alert-error-color);
        margin-bottom: 16px;
      }
    `,
  ];
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-rename-dialog": ESPHomeRenameDialog;
  }
}
