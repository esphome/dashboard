import { fireEvent } from "../util/fire-event";

export const openEditDialog = (configuration: string) => {
  fireEvent(document.body, "edit-file", configuration);
};

export const toggleSearch = () => {
  fireEvent(document.body, "toggle-search");
};
