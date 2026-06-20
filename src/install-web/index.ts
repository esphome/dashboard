import { openNoPortPickedDialog } from "../no-port-picked";
import { createESPLoader } from "../web-serial/create-esploader";
import type { ESPHomeInstallWebDialog } from "./install-web-dialog";

export const preloadInstallWebDialog = () => import("./install-web-dialog");

export const openInstallWebDialog = async (
  params: ESPHomeInstallWebDialog["params"],
  // Called if a port has been picked and the dialog will be opened.
  onDialogOpen?: () => void,
): Promise<void> => {
  preloadInstallWebDialog();

  let port = params.port;

  if (port) {
    // ESPLoader likes opening the port; tolerate a port that isn't open yet
    // (a caller may pass a freshly-requested, unopened port).
    try {
      await port.close();
    } catch {
      // not open / already closed
    }
  } else {
    try {
      port = await navigator.serial.requestPort();
    } catch (err: any) {
      if ((err as DOMException).name === "NotFoundError") {
        openNoPortPickedDialog(() =>
          openInstallWebDialog(params, onDialogOpen),
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
