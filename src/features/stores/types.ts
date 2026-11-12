export type Store = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  lat: number;
  lng: number;
  distanceM: number | null;
  placeUrl: string;
};
