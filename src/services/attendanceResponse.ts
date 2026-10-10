/** Convert the attendance API's nested snake_case records to frontend names. */
export function normalizeAttendanceResponse<T>(value: unknown): T {
  const convert = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(convert);
    if (item !== null && typeof item === 'object') {
      return Object.fromEntries(Object.entries(item).map(([key, child]) => [
        key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
        convert(child),
      ]));
    }
    return item;
  };
  return convert(value) as T;
}
