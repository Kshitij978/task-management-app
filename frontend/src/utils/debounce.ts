export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  wait = 250
) {
  let timer: number | null = null;
  return (...args: Parameters<T>) => {
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
      timer = null;
    }, wait) as unknown as number;
  };
}
