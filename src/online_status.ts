import { getOnlineStatus } from "./api/ping";
import { createPollingCollection } from "./util/polling-collection";

export const subscribeOnlineStatus = createPollingCollection(
  getOnlineStatus,
  2000
);
