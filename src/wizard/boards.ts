import { html } from "lit";
import { SupportedBoards } from "../api/boards";

export const boardSelectOptions = (boards: SupportedBoards | undefined) =>
  boards &&
  Object.values(boards).map(
    (group) => html`
      <optgroup label="${group.title}">
        ${Object.keys(group.items).map(
          (key) => html`<option value="${key}">${group.items[key]}</option>`
        )}
      </optgroup>
    `
  );
