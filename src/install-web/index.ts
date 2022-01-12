import { connect, ESPLoader } from "esp-web-flasher";
import { openNoPortPickedDialog } from "../no-port-picked";
import type { ESPHomeInstallWebDialog } from "./install-web-dialog";

const preload = () => import("./install-web-dialog");

export const openInstallWebDialog = async (
  params: ESPHomeInstallWebDialog["params"],
  // Called if a port has been picked and the dialog will be opened.
  onDialogOpen?: () => void
): Promise<void> => {
  preload();

  let esploader: ESPLoader;

  if (params.port) {
    esploader = new ESPLoader(params.port, console);
  } else {
    try {
      esploader = await connect(console);
    } catch (err: any) {
      if ((err as DOMException).name === "NotFoundError") {
        openNoPortPickedDialog(() =>
          openInstallWebDialog(params, onDialogOpen)
        );
      } else {
        alert(`Unable to connect: ${err.message}`);
      }
      return;
    }
  }

  if (onDialogOpen) {
    onDialogOpen();
  }

  const dialog = document.createElement("esphome-install-web-dialog");
  dialog.params = params;
  dialog.esploader = esploader;
  document.body.append(dialog);
};
