export const debounce = (func: Function, wait: number) => {
  let timeout: number | null;
  return function () {
    // @ts-ignore
    let context = this,
      args = arguments;
    let later = function () {
      timeout = null;
      func.apply(context, args);
    };
    clearTimeout(timeout!);
    // @ts-ignore
    timeout = setTimeout(later, wait);
  };
};
