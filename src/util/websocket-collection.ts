import { dashboardWebSocket } from "../api/websocket";

export interface WebSocketCollection<T> {
  subscribe(onChange: (data: T) => void): () => void;
  refresh(): void;
}

export const createWebSocketCollection = <T>(
  events: { [key: string]: (data: T, update: any) => T }
): WebSocketCollection<T> => {
  let data: T | undefined;
  const subscribers = new Set<(data: T) => void>();
  const unsubscribers: (() => void)[] = [];

  const notifySubscribers = () => {
    if (data !== undefined) {
      subscribers.forEach(callback => callback(data!));
    }
  };

  // Subscribe to WebSocket events
  for (const [event, handler] of Object.entries(events)) {
    const unsub = dashboardWebSocket.on(event, (eventData) => {
      // For initial_state, pass undefined as current state; otherwise use existing data
      if (event === "initial_state" || data !== undefined) {
        data = handler(data as T, eventData);
        notifySubscribers();
      }
    });
    unsubscribers.push(unsub);
  }

  // Connect WebSocket when first subscriber is added
  let isConnected = false;

  return {
    subscribe(onChange: (data: T) => void): () => void {
      subscribers.add(onChange);

      // Connect WebSocket on first subscriber
      if (!isConnected) {
        dashboardWebSocket.connect();
        isConnected = true;
      }

      // Call onChange immediately with current data if available
      if (data !== undefined) {
        onChange(data);
      }

      // Return unsubscribe function
      return () => {
        subscribers.delete(onChange);

        // Disconnect WebSocket when no subscribers left
        if (subscribers.size === 0 && isConnected) {
          dashboardWebSocket.disconnect();
          isConnected = false;
        }
      };
    },

    refresh(): void {
      // WebSocket doesn't need manual refresh - it's real-time
      // But we can reconnect if disconnected
      if (!dashboardWebSocket.isConnected()) {
        dashboardWebSocket.connect();
      }
    }
  };
};