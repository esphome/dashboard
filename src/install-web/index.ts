import type { IEspLoaderTerminal } from "esptool-js";
import { openNoPortPickedDialog } from "../no-port-picked";
import { createESPLoader } from "../web-serial/create-esploader";
import type { ESPHomeInstallWebDialog } from "./install-web-dialog";

export class ESPLoaderTerminalStream {
  public stream: ReadableStream;
  public terminal: IEspLoaderTerminal;
  private controller?: ReadableStreamDefaultController<any>;

  constructor() {
    const _this = this;
    this.stream = new ReadableStream({
      start(controller) {
        _this.controller = controller;
      },
    });

    this.terminal = {
      clean: () => {
        this.controller?.enqueue("\n\n\n");
      },
      writeLine: (data: string) => {
        console.log(data);
        this.controller?.enqueue(`${data}\n`);
      },
      write: (data: string) => {
        console.log(data);
        // Fix "Connecting..." line break
        if (data == "\n\r") this.controller?.enqueue("\n");
        else this.controller?.enqueue(data);
      },
    };
  }
}

export const preloadInstallWebDialog = () => import("./install-web-dialog");

export const openInstallWebDialog = async (
  params: ESPHomeInstallWebDialog["params"],
  // Called if a port has been picked and the dialog will be opened.
  onDialogOpen?: () => void,
): Promise<void> => {
  preloadInstallWebDialog();

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
          openInstallWebDialog(params, onDialogOpen),
        );
      } else {
        alert(`Unable to connect: ${err.message}`);
      }
      return;
    }
  }

  const terminalStream = new ESPLoaderTerminalStream();

  const esploader = createESPLoader(port, terminalStream.terminal);

  if (onDialogOpen) {
    onDialogOpen();
  }

  const dialog = document.createElement("esphome-install-web-dialog");
  dialog.params = params;
  dialog.esploader = esploader;
  dialog.stream = terminalStream.stream;
  document.body.append(dialog);
};
