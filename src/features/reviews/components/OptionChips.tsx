import { reviewOptionLabels, type ReviewOptionId } from "../options";
// Read-only chips for options saved with a record; unknown values are skipped.
export function OptionChips({ options }: { options?: readonly string[] }) {
  const known = (options ?? []).filter(
    (o): o is ReviewOptionId => o in reviewOptionLabels,
  );
  if (!known.length) return null;
  return (
    <ul className="option-chips" aria-label="커스텀 옵션">
      {known.map((o) => (
        <li key={o}>{reviewOptionLabels[o]}</li>
      ))}
    </ul>
  );
}
