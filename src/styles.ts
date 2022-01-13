import { css } from "lit";

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
