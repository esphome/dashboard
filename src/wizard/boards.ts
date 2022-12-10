import { html } from "lit";
import { SupportedBoards } from "../api/boards";

export const boardSelectOptions = (
  boards: SupportedBoards | undefined,
  selected: string | null = null
) =>
  boards &&
  Object.values(boards).map(
    (group) => html`
      <optgroup label="${group.title}">
        ${Object.keys(group.items).map((key) =>
          key === selected
            ? html`<option value="${key}" selected>${group.items[key]}</option>`
            : html`<option value="${key}">${group.items[key]}</option>`
        )}
      </optgroup>
    `
  );
