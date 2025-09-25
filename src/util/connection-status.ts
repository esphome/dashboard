import "@material/mwc-snackbar";
import type { Snackbar } from "@material/mwc-snackbar";

class ConnectionStatus {
  private snackbar: Snackbar | null = null;
  private isConnected = true;
  private reconnectAttempts = 0;

  public initialize(): void {
    // Create and append snackbar to body
    if (!this.snackbar) {
      this.snackbar = document.createElement("mwc-snackbar") as Snackbar;
      this.snackbar.stacked = false;
      this.snackbar.leading = false;
      this.snackbar.timeoutMs = -1; // Keep open until dismissed
      document.body.appendChild(this.snackbar);
    }
  }

  public setConnected(): void {
    if (!this.isConnected) {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      if (this.snackbar?.open) {
        this.snackbar.close();
      }
      // Show reconnected message briefly
      if (this.snackbar) {
        // Need to wait for close to complete before showing with new timeout
        setTimeout(() => {
          if (this.snackbar) {
            this.snackbar.labelText = "Connection restored";
            this.snackbar.timeoutMs = 4000; // Minimum allowed timeout
            this.snackbar.show();
          }
        }, 100);
      }
    }
  }

  public setDisconnected(): void {
    if (this.isConnected) {
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }

    if (this.snackbar) {
      this.snackbar.labelText = "Connection lost. Reconnecting...";
      this.snackbar.timeoutMs = -1; // Keep open
      if (!this.snackbar.open) {
        this.snackbar.show();
      }
    }
  }

  public setReconnecting(): void {
    this.reconnectAttempts++;
    if (this.snackbar && this.snackbar.open) {
      this.snackbar.labelText = `Connection lost. Reconnecting... (attempt ${this.reconnectAttempts})`;
    }
  }
}

export const connectionStatus = new ConnectionStatus();