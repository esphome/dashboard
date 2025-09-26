import { fetchApiJson } from ".";
import { createWebSocketCollection } from "../util/websocket-collection";
import { ServerEvent } from "./dashboard-events";

export const getOnlineStatus = () =>
  fetchApiJson<Record<string, boolean>>("./ping");

// Use WebSocket for real-time dashboard events
export const subscribeOnlineStatus = (() => {
  const collection = createWebSocketCollection<Record<string, boolean>>({
    [ServerEvent.INITIAL_STATE]: (_, data) => data.ping,
    [ServerEvent.ENTRY_STATE_CHANGED]: (current, data) => ({
      ...current,
      [data.filename]: data.state,
    }),
  });
  return (onChange: (data: Record<string, boolean>) => void) =>
    collection.subscribe(onChange);
})();
