export const editCallback: { callback?: (configuration: string) => void } = {};

export const openEditDialog = (configuration: string) => {
  editCallback.callback?.(configuration);
};
