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
    --mdc-theme-primary: var(--primary-text-color);
    --mdc-button-horizontal-padding: 12px;
    font-size: 13px;
  }
  .card-actions {
    display: flex;
    padding: 4px 8px;
    align-items: center;
    gap: 4px;
  }
  .card-actions a {
    text-decoration: none;
  }
  .card-actions mwc-icon-button {
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 20px;
  }
`;

export const esphomeDialogStyles = css`
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
    --mdc-theme-primary: var(--mdc-theme-primary-no-attention);
    --mdc-theme-on-primary: var(--mdc-theme-on-primary-no-attention);
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

  mwc-button {
    --mdc-theme-primary: var(--primary-text-color);
  }
`;

export const esphomeSvgStyles = css`
  .svg-fill-primary {
    fill: var(--primary-text-color);
  }
`;
