import { html } from "lit";

export const ARROW = html`
  <div class="arrow">
    <svg width="48" height="48" viewBox="0 0 24 24">
      <path
        d="M20 18V20H13.5C9.91 20 7 17.09 7 13.5V7.83L3.91 10.92L2.5 9.5L8 4L13.5 9.5L12.09 10.91L9 7.83V13.5C9 16 11 18 13.5 18H20Z"
      />
    </svg>
  </div>
`;

export const ARROW_RIGHT = html`
  <svg width="48" height="48" viewBox="0 0 24 24">
    <path
      d="M21.5 9.5L20.09 10.92L17 7.83V13.5C17 17.09 14.09 20 10.5 20H4V18H10.5C13 18 15 16 15 13.5V7.83L11.91 10.91L10.5 9.5L16 4L21.5 9.5Z"
    />
  </svg>
`;
