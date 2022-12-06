import { html } from "lit";
import { SupportedBoards } from "../api/boards";

export const boardSelectOptions = (boards: SupportedBoards | undefined) =>
  boards &&
  html`
    <optgroup label="ESP32">
      ${Object.keys(boards.esp32).map(
        (key) => html`<option value="${key}">${boards.esp32[key]}</option>`,
      )}
    </optgroup>
    <optgroup label="ESP8266">
      ${Object.keys(boards.esp8266).map(
        (key) => html`<option value="${key}">${boards.esp8266[key]}</option>`,
      )}
    </optgroup>
    <optgroup label="Raspberry Pi">
      ${Object.keys(boards.rp2040).map(
        (key) => html`<option value="${key}">${boards.rp2040[key]}</option>`,
      )}
    </optgroup>
  `;
