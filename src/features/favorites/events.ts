const eventName = "hancup:favorite-changed";
type FavoriteChange = { drinkId: string; saved: boolean };
export function publishFavoriteChange(drinkId: string, saved: boolean) {
  window.dispatchEvent(
    new CustomEvent<FavoriteChange>(eventName, { detail: { drinkId, saved } }),
  );
}
export function subscribeFavoriteChange(
  drinkId: string,
  onChange: (saved: boolean) => void,
) {
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<FavoriteChange>).detail;
    if (detail?.drinkId === drinkId && typeof detail.saved === "boolean")
      onChange(detail.saved);
  };
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}
