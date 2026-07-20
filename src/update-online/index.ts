import type { ESPHomeUpdateOnlineDialog } from "./update-online-dialog";

const preload = () => import("./update-online-dialog");

/**
 * Opens the Update Online dialog to update multiple devices sequentially.
 * Each device is compiled and uploaded via OTA, with verification after completion.
 * @param configurations - Array of device configuration filenames to update
 */
export const openUpdateOnlineDialog = (configurations: string[]) => {
  preload();
  const dialog = document.createElement(
    "esphome-update-online-dialog",
  ) as ESPHomeUpdateOnlineDialog;
  dialog.configurations = configurations;
  document.body.append(dialog);
};
