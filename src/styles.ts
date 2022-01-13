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
  a {
    color: var(--mdc-theme-primary);
  }

  a[slot="primaryAction"],
  a[slot="secondaryAction"] {
    text-decoration: none;
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
`;
