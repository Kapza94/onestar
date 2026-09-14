export type PresenceEvent = {
  country: string | null;
  countryName: string;
  city: string | null;
  ago: string;
  action: string;
};

export type PresenceDot = {
  lat: number;
  lng: number;
  live: boolean;
  count: number;
};

export type PresenceSnapshot = {
  live: number;
  countries: number;
  total: number;
  since: string;
  events: PresenceEvent[];
  topCountries: { code: string; name: string; count: number }[];
  dots: PresenceDot[];
  recentIdeas: { idea: string; at: number }[];
};
