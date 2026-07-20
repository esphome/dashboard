export const fireEvent = (
  eventTarget: EventTarget,
  type: string,
  // @ts-ignore
  detail?: unknown,
  options?: {
    bubbles?: boolean;
    cancelable?: boolean;
    composed?: boolean;
  },
): void => {
  const event = new CustomEvent(type, {
    bubbles: options?.bubbles ?? true,
    cancelable: options?.cancelable ?? false,
    composed: options?.composed ?? true,
    detail,
  });
  eventTarget.dispatchEvent(event);
};
