export function nonEmptyItems<T>(list?: Array<T | null | undefined>): Array<T> {
  return (list || []).filter(
    (item) => item !== null && item !== undefined
  ) as Array<T>;
}
