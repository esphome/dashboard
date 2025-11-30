/**
 * Dashboard WebSocket event types.
 * These should match the DashboardEvent enum in the backend.
 */

// Server -> Client events (backend sends to frontend)
export const ServerEvent = {
  ENTRY_ADDED: "entry_added",
  ENTRY_REMOVED: "entry_removed",
  ENTRY_UPDATED: "entry_updated",
  ENTRY_STATE_CHANGED: "entry_state_changed",
  IMPORTABLE_DEVICE_ADDED: "importable_device_added",
  IMPORTABLE_DEVICE_REMOVED: "importable_device_removed",
  INITIAL_STATE: "initial_state",
  PONG: "pong",
} as const;

// Client -> Server events (frontend sends to backend)
export const ClientEvent = {
  PING: "ping",
  REFRESH: "refresh",
} as const;

// Combined for backwards compatibility
export const DashboardEvent = {
  ...ServerEvent,
  ...ClientEvent,
} as const;

export type DashboardEventType =
  (typeof DashboardEvent)[keyof typeof DashboardEvent];
