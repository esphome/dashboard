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

export const attachOnlineStatus = () =>
  subscribeOnlineStatus((statuses) => {
    for (let filename in statuses) {
      let node = document.querySelector(
        `#nodes .card[data-filename="${filename}"]`
      );

      if (node === null) {
        continue;
      }

      let status = statuses[filename];
      let className;

      if (status === null) {
        className = "status-unknown";
      } else if (status === true) {
        className = "status-online";
        node.setAttribute("data-last-connected", Date.now().toString());
      } else if (node.hasAttribute("data-last-connected")) {
        const attr = parseInt(node.getAttribute("data-last-connected")!);
        if (Date.now() - attr <= 5000) {
          className = "status-not-responding";
        } else {
          className = "status-offline";
        }
      } else {
        className = "status-offline";
      }

      if (node.classList.contains(className)) {
        continue;
      }

      node.classList.remove(
        "status-unknown",
        "status-online",
        "status-offline",
        "status-not-responding"
      );
      node.classList.add(className);
    }
  });
