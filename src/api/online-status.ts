import { fetchApiJson } from ".";
import { createWebSocketCollection } from "../util/websocket-collection";

export const getOnlineStatus = () =>
  fetchApiJson<Record<string, boolean>>("./ping");

// Use WebSocket for real-time ping status updates
const onlineStatusCollection = createWebSocketCollection<Record<string, boolean>>({
  initial_state: (_, data) => data.ping,
  state_changed: (current, data) => ({
    ...current,
    [data.filename]: data.state,
  }),
});

// Maintain backward compatibility with existing code
export const subscribeOnlineStatus = (onChange: (data: Record<string, boolean>) => void) => {
  return onlineStatusCollection.subscribe(onChange);
};
