/**
 * Index of the value to mark "가장 낮음" in a comparison row, or null.
 * Only claimed when at least two values are compared, every value is known
 * (null means not provided) and exactly one value is the minimum.
 */
export function lowestIndex(values: (number | null)[]): number | null {
  if (values.length < 2 || values.some((v) => v === null)) return null;
  const known = values as number[];
  const min = Math.min(...known);
  const at = known.flatMap((v, i) => (v === min ? [i] : []));
  return at.length === 1 ? at[0] : null;
}
