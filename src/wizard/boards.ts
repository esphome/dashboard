import { html } from "lit";
import { SupportedBoards } from "../api/boards";

export const boardSelectOptions = (
  boards: SupportedBoards | undefined,
  defaultBoard: string | null = null
) =>
  boards &&
  Object.values(boards).map((group) => {
    const hasDefault =
      defaultBoard && Object.keys(group.items).includes(defaultBoard);
    return html`
      ${hasDefault &&
      html`<option value="${defaultBoard}" selected>
        ${group.items[defaultBoard]}
      </option>`}
      ${hasDefault && html`<option disabled>------</option>`}
      ${group.title && html`<optgroup label="${group.title}"></optgroup>`}
      ${Object.keys(group.items).map(
        (key) =>
          key !== defaultBoard &&
          html`<option value="${key}">${group.items[key]}</option>`
      )}
      ${group.title && html`</optgroup>`}
    `;
  });
