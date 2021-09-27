import { getOnlineStatus } from "./api/ping";

type StatusCallback = (devices: Record<string, boolean>) => unknown;

let pollSubscription: number | undefined;
let lastResult: Record<string, boolean> | undefined;
const subscribers: StatusCallback[] = [];

export const subscribeOnlineStatus = (
  onUpdate: StatusCallback
): (() => void) => {
  subscribers.push(onUpdate);

  const unsubscribe = () => {
    const index = subscribers.indexOf(onUpdate);
    if (index === -1) {
      return;
    }
    subscribers.splice(index);

    // No subscribers anymore, cleanup
    if (subscribers.length === 0) {
      // Clear next scheduled instance
      clearTimeout(pollSubscription);
      // Indicate to a running instance to not re-schedule follow-up
      pollSubscription = undefined;
      // Clear last result as it will be stale
      lastResult = undefined;
    }
  };

  // First subscriber, start subscription
  if (subscribers.length > 1) {
    if (lastResult) {
      const result = lastResult;
      setTimeout(() => onUpdate(result!), 0);
    }
    return unsubscribe;
  }

  pollSubscription = window.setTimeout(fetchPing, 2000);

  return unsubscribe;
};

const fetchPing = async () => {
  const nextRun = new Date().getTime() + 2000;

  try {
    lastResult = await getOnlineStatus();

    for (const cb of subscribers) {
      cb(lastResult);
    }
  } finally {
    // Check if we got canceled while we were doing an update
    if (pollSubscription !== undefined) {
      const delay = Math.max(0, nextRun - new Date().getTime());
      pollSubscription = window.setTimeout(fetchPing, delay);
    }
  }
};
