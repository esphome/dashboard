import { fetchApiJson } from ".";
import { createWebSocketCollection } from "../util/websocket-collection";

export const getOnlineStatus = () =>
  fetchApiJson<Record<string, boolean>>("./ping");

// Use WebSocket for real-time dashboard events
export const subscribeOnlineStatus = (() => {
  const collection = createWebSocketCollection<Record<string, boolean>>({
    initial_state: (_, data) => data.ping,
    entry_state_changed: (current, data) => ({
      ...current,
      [data.filename]: data.state,
    }),
  });
  return (onChange: (data: Record<string, boolean>) => void) =>
    collection.subscribe(onChange);
})();
