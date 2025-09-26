import type { ListDevicesResult } from "./devices";
import { connectionStatus } from "../util/connection-status";
import { buildWebSocketUrl } from "../util/websocket-url";

export interface WebSocketMessage {
  event: string;
  data: any;
}

export interface InitialStateData {
  devices: ListDevicesResult;
  ping: Record<string, boolean>;
}

export interface StateChangedData {
  filename: string;
  name: string;
  state: boolean;
}

export interface DeviceUpdateData {
  device: any;
}

type MessageHandler = (data: any) => void;

class DashboardWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private handlers = new Map<string, Set<MessageHandler>>();
  private isConnecting = false;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private readonly PING_INTERVAL = 25000; // 25 seconds (less than server's 30s timeout)

  constructor() {
    this.url = buildWebSocketUrl("events");
  }

  connect(): void {
    if (this.ws || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.isConnecting = false;
      this.reconnectDelay = 1000; // Reset reconnect delay on successful connection
      connectionStatus.setConnected();
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("Dashboard WebSocket error:", error);
      this.isConnecting = false;
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.isConnecting = false;
      this.stopPing();
      connectionStatus.setDisconnected();
      this.scheduleReconnect();
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.handlers.get(message.event);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    // Update status to show reconnection attempts
    if (this.reconnectDelay > 1000) {
      connectionStatus.setReconnecting();
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
      // Exponential backoff with max delay
      this.reconnectDelay = Math.min(
        this.reconnectDelay * 2,
        this.maxReconnectDelay,
      );
    }, this.reconnectDelay) as unknown as number;
  }

  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.handlers.delete(event);
        }
      }
    };
  }

  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ws!.send(JSON.stringify({ event: "ping" }));
      }
    }, this.PING_INTERVAL) as unknown as number;
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const dashboardWebSocket = new DashboardWebSocket();
