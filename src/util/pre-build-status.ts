import "@material/mwc-snackbar";
import type { Snackbar } from "@material/mwc-snackbar";
import { dashboardWebSocket } from "../api/websocket";
import { ServerEvent } from "../api/dashboard-events";

interface PreBuildEventData {
  status: string;
  total?: number;
  version?: string;
  filename?: string;
  name?: string;
  error?: string;
  current?: number;
  succeeded?: number;
  failed?: number;
}

class PreBuildStatus {
  private snackbar: Snackbar | null = null;

  public initialize(): void {
    if (!this.snackbar) {
      this.snackbar = document.createElement("mwc-snackbar") as Snackbar;
      this.snackbar.stacked = false;
      this.snackbar.leading = false;
      document.body.appendChild(this.snackbar);
    }

    dashboardWebSocket.on(
      ServerEvent.PRE_BUILD_STATUS,
      (data: PreBuildEventData) => {
        this.handleEvent(data);
      },
    );
  }

  private handleEvent(data: PreBuildEventData): void {
    if (!this.snackbar) return;

    switch (data.status) {
      case "started":
        this.snackbar.labelText = `Pre-building firmware for ${data.total} device(s)...`;
        this.snackbar.timeoutMs = -1;
        this.snackbar.show();
        break;

      case "device_done":
        this.snackbar.labelText = `Built ${data.name} (${data.current}/${data.total})...`;
        break;

      case "device_failed":
        this.snackbar.labelText = `Failed to build ${data.name} (${data.current}/${data.total})...`;
        break;

      case "finished":
        this.snackbar.labelText = `Pre-build complete: ${data.succeeded} succeeded, ${data.failed} failed`;
        this.snackbar.timeoutMs = 8000;
        // Close and re-show to apply new timeout
        this.snackbar.close();
        setTimeout(() => {
          if (this.snackbar) {
            this.snackbar.show();
          }
        }, 100);
        break;
    }
  }
}

export const preBuildStatus = new PreBuildStatus();
