import { css } from "lit";

export const esphomeCardStyles = css`
  esphome-card {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  a {
    color: var(--mdc-theme-primary);
  }
  .flex {
    flex: 1;
  }
  mwc-button {
    line-height: 1em;
  }
  .card-actions {
    display: flex;
    padding: 4px;
    align-items: center;
  }
  .card-actions a {
    text-decoration: none;
  }
  .card-actions mwc-button {
    --mdc-theme-primary: rgba(0, 0, 0, 0.88);
  }
  esphome-button-menu {
    color: rgba(0, 0, 0, 0.88);
  }
  .card-actions mwc-icon-button {
    --mdc-icon-button-size: 32px;
  }
`;

export const esphomeDialogStyles = css`
  :host {
    --mdc-dialog-content-ink-color: #212121;
  }

  a {
    color: var(--mdc-theme-primary);
  }

  a[slot="primaryAction"],
  a[slot="secondaryAction"] {
    text-decoration: none;
  }

  mwc-textfield:first-child,
  div:first-child {
    margin-top: 0;
  }

  mwc-textfield + div,
  div + div {
    margin-top: 16px;
  }

  mwc-textfield,
  mwc-formfield {
    display: block;
  }

  mwc-textfield,
  mwc-textfield:not([required]) + div {
    margin-top: 16px;
  }

  .formfield-extra {
    margin-left: 52px;
    margin-bottom: 16px;
  }

  button.link {
    background: none;
    color: var(--mdc-theme-primary);
    border: none;
    padding: 0;
    font: inherit;
    text-align: left;
    text-decoration: underline;
    cursor: pointer;
  }

  mwc-button[no-attention] {
    --mdc-theme-primary: #444;
    --mdc-theme-on-primary: white;
  }

  @media only screen and (max-width: 450px) {
    mwc-dialog {
      --mdc-dialog-min-width: 100vw !important;
      --mdc-dialog-max-width: 100vw !important;
      --mdc-dialog-max-height: 100vh !important;
      --mdc-dialog-max-height: calc(
        90vh - env(safe-area-inset-bottom)
      ) !important;
    }
  }

  mwc-list.platforms {
    margin: 0 -24px;
  }

  mwc-list.platforms mwc-list-item {
    padding: 0 24px;
  }
`;
