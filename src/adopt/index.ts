import { ImportableDevice } from "../api/devices";

const preload = () => import("./adopt-dialog");

export const openAdoptDialog = (
  device: ImportableDevice,
  onAdopt: () => void
) => {
  preload();
  const dialog = document.createElement("esphome-adopt-dialog");
  dialog.device = device;
  dialog.addEventListener("adopted", onAdopt);
  document.body.append(dialog);
};
