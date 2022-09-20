import { LitElement, html, css } from "lit";
import { createRef, Ref, ref } from "lit/directives/ref.js";
import { customElement, property, state } from "lit/decorators.js";
import "@material/mwc-dialog";
import "@material/mwc-button";
import "@material/mwc-snackbar";
import "@material/mwc-list/mwc-list-item.js";
import "./esphome-editor";
import { esphomeDialogStyles } from "../styles";
import { ESPHomeEditor } from "./esphome-editor";
import { openInstallChooseDialog } from "../install-choose";
import { writeFile } from "../api/files";

@customElement("esphome-editor-dialog")
class ESPHomeEditorDialog extends LitElement {
  @property() public fileName!: string;

  editorRef: Ref<ESPHomeEditor> = createRef();

  @state() private successSnackbarOpened = false;
  @state() private errorSnackbarOpened = false;

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
    <!--Success message-->
      <mwc-snackbar
        labeltext="✅ Saved ${this.fileName}"
        .open="${this.successSnackbarOpened}"
        @MDCSnackbar:closed=${() => (this.successSnackbarOpened = false)}
      >
        <mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
      </mwc-snackbar>
    <!--Error message-->
      <mwc-snackbar
        labeltext="❌ An error occured saving ${this.fileName}"
        .open="${this.errorSnackbarOpened}"
        @MDCSnackbar:closed=${() => (this.errorSnackbarOpened = false)}
      >
        <mwc-icon-button icon="close" slot="dismiss"></mwc-icon-button>
      </mwc-snackbar>

      <esphome-editor
        configuration=${this.fileName}
        ${ref(this.editorRef)}
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
    const code = this.editorRef.value!.getValue();

    try {
      await writeFile(this.fileName, code ?? "");
      this.successSnackbarOpened = true;

    } catch (error) {
      this.errorSnackbarOpened = true;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "esphome-editor-dialog": ESPHomeEditorDialog;
  }
}
