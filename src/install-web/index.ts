import type { ESPLoader } from "esp-web-flasher";

const preload = () => import("./install-web-dialog");

export const openInstallWebDialog = (
  configuration: string,
  esploader: ESPLoader
) => {
  preload();
  const dialog = document.createElement("esphome-install-web-dialog");
  dialog.configuration = configuration;
  dialog.esploader = esploader;
  document.body.append(dialog);
};
