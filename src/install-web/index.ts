import { openNoPortPickedDialog } from "../no-port-picked";
import { createESPLoader } from "../web-serial/create-esploader";
import type { ESPHomeInstallWebDialog } from "./install-web-dialog";

const preload = () => import("./install-web-dialog");

export const openInstallWebDialog = async (
  params: ESPHomeInstallWebDialog["params"],
  // Called if a port has been picked and the dialog will be opened.
  onDialogOpen?: () => void
): Promise<void> => {
  preload();

  let port = params.port;

  if (port) {
    // ESPLoader likes opening the port.
    await port.close();
  } else {
    try {
      port = await navigator.serial.requestPort();
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
  const esploader = createESPLoader(port);

  if (onDialogOpen) {
    onDialogOpen();
  }

  const dialog = document.createElement("esphome-install-web-dialog");
  dialog.params = params;
  dialog.esploader = esploader;
  document.body.append(dialog);
};
