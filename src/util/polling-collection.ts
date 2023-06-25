export const createPollingCollection = <T>(
  fetchData: () => Promise<T>,
  interval: number
) => {
  let pollSubscription: number | undefined;
  let lastResult: T | undefined;
  const subscribers: ((data: T) => unknown)[] = [];

  const updateData = async () => {
    const nextRun = new Date().getTime() + interval;

    try {
      lastResult = await fetchData();

      for (const cb of subscribers) {
        cb(lastResult);
      }
    } finally {
      // If we still have subscribers, schedule another update
      if (subscribers.length > 0) {
        const delay = Math.max(0, nextRun - new Date().getTime());
        pollSubscription = window.setTimeout(updateData, delay);
      }
    }
  };

  return (onUpdate: (data: T) => unknown) => {
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
        if (pollSubscription) clearTimeout(pollSubscription);
        pollSubscription = undefined;
        // Clear last result as it will be stale
        lastResult = undefined;
      }
    };

    unsubscribe.refresh = async () => {
      if (pollSubscription) clearTimeout(pollSubscription);
      pollSubscription = undefined;
      await updateData();
    };

    // First subscriber, start subscription
    if (subscribers.length > 1) {
      if (lastResult) {
        const result = lastResult;
        setTimeout(() => onUpdate(result!), 0);
      }
      return unsubscribe;
    }

    updateData();

    return unsubscribe;
  };
};
