import { LitElement, html, css } from "lit";
import { customElement, property, query } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "@material/mwc-snackbar";
import "@material/mwc-list/mwc-list-item.js";
import "./esphome-editor";
import { esphomeDialogStyles } from "../styles";
import { ESPHomeEditor } from "./esphome-editor";
import { openInstallChooseDialog } from "../install-choose";
import { writeFile } from "../api/files";
import type { Snackbar } from "@material/mwc-snackbar";

@customElement("esphome-editor-dialog")
class ESPHomeEditorDialog extends LitElement {
  @property() public fileName!: string;

  @query("esphome-editor", true) private _editor!: ESPHomeEditor;

  @query("mwc-snackbar", true) private _snackbar!: Snackbar;

  protected render() {
    const isSecrets =
      this.fileName === "secrets.yaml" || this.fileName === "secrets.yml";

    return html`<mwc-dialog
      open
      heading=${`Edit ${this.fileName}`}
      scrimClickAction
      escapeKeyAction
      @closed=${this._handleClose}
    >
      <mwc-snackbar></mwc-snackbar>
      <esphome-editor
        configuration=${this.fileName}
        @save=${this._saveFile}
      ></esphome-editor>
      <mwc-button
        slot="secondaryAction"
        label="Save"
        @click=${this._saveFile}
      ></mwc-button>
      ${isSecrets
        ? ""
        : html` <mwc-button
            slot="secondaryAction"
            label="Install"
            @click=${this.handleInstall}
          ></mwc-button>`}
      <mwc-button
        slot="secondaryAction"
        dialogAction="close"
        label="Close"
      ></mwc-button>
    </mwc-dialog> `;
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

      esphome-remote-process {
        height: calc(90vh - var(--height-header-footer-padding));
      }

      @media only screen and (max-width: 450px) {
        esphome-remote-process {
          height: calc(
            90vh - var(--height-header-footer-padding) -
              env(safe-area-inset-bottom)
          );
          margin-left: -24px;
          margin-right: -24px;
        }
      }
    `,
  ];

  private _handleClose() {
    this.parentNode!.removeChild(this);
  }

  private async handleInstall() {
    await this._saveFile();
    this._handleClose();
    openInstallChooseDialog(this.fileName);
  }

  private async _saveFile() {
    const code = this._editor.getValue();
    if (this._snackbar.open) {
      this._snackbar.close();
    }

    try {
      await writeFile(this.fileName, code ?? "");
      this._showSnackbar(`✅ Saved ${this.fileName}`);
    } catch (error) {
      this._showSnackbar(`❌ An error occured saving ${this.fileName}`);
    }
  }

  private _showSnackbar(message: string) {
    this._snackbar.labelText = message;
    this._snackbar.show();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-editor-dialog": ESPHomeEditorDialog;
  }
}
