import { connect, ESPLoader } from "esp-web-flasher";
import type { ESPHomeInstallWebDialog } from "./install-web-dialog";

const preload = () => import("./install-web-dialog");

export const openInstallWebDialog = async (
  params: ESPHomeInstallWebDialog["params"]
): Promise<boolean> => {
  preload();

  let esploader: ESPLoader;

  if (params.port) {
    esploader = new ESPLoader(params.port, console);
  } else {
    try {
      esploader = await connect(console);
    } catch (err: any) {
      if ((err as DOMException).name !== "NotFoundError") {
        alert(`Unable to connect: ${err.message}`);
      }
      return false;
    }
  }

  const dialog = document.createElement("esphome-install-web-dialog");
  dialog.params = params;
  dialog.esploader = esploader;
  document.body.append(dialog);
  return true;
};
