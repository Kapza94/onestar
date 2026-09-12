export const COUNTRY_META: Record<string, { name: string; lat: number; lng: number }> = {
  US: { name: "United States", lat: 39.8, lng: -98.5 },
  CA: { name: "Canada", lat: 56.1, lng: -106.3 },
  MX: { name: "Mexico", lat: 23.6, lng: -102.5 },
  BR: { name: "Brazil", lat: -14.2, lng: -51.9 },
  AR: { name: "Argentina", lat: -38.4, lng: -63.6 },
  GB: { name: "United Kingdom", lat: 55.4, lng: -3.4 },
  IE: { name: "Ireland", lat: 53.1, lng: -8.2 },
  FR: { name: "France", lat: 46.2, lng: 2.2 },
  DE: { name: "Germany", lat: 51.2, lng: 10.4 },
  ES: { name: "Spain", lat: 40.5, lng: -3.7 },
  IT: { name: "Italy", lat: 41.9, lng: 12.6 },
  NL: { name: "Netherlands", lat: 52.1, lng: 5.3 },
  BE: { name: "Belgium", lat: 50.5, lng: 4.5 },
  SE: { name: "Sweden", lat: 60.1, lng: 18.6 },
  NO: { name: "Norway", lat: 60.5, lng: 8.5 },
  PL: { name: "Poland", lat: 51.9, lng: 19.1 },
  PT: { name: "Portugal", lat: 39.4, lng: -8.2 },
  CH: { name: "Switzerland", lat: 46.8, lng: 8.2 },
  AT: { name: "Austria", lat: 47.5, lng: 14.6 },
  RS: { name: "Serbia", lat: 44.0, lng: 21.0 },
  HR: { name: "Croatia", lat: 45.1, lng: 15.2 },
  TR: { name: "Turkey", lat: 38.96, lng: 35.2 },
  UA: { name: "Ukraine", lat: 48.4, lng: 31.2 },
  RU: { name: "Russia", lat: 61.5, lng: 105.3 },
  IN: { name: "India", lat: 20.6, lng: 79.0 },
  CN: { name: "China", lat: 35.9, lng: 104.2 },
  JP: { name: "Japan", lat: 36.2, lng: 138.3 },
  KR: { name: "South Korea", lat: 35.9, lng: 127.8 },
  SG: { name: "Singapore", lat: 1.35, lng: 103.8 },
  HK: { name: "Hong Kong", lat: 22.3, lng: 114.2 },
  TW: { name: "Taiwan", lat: 23.7, lng: 121.0 },
  AU: { name: "Australia", lat: -25.3, lng: 133.8 },
  NZ: { name: "New Zealand", lat: -40.9, lng: 174.9 },
  ZA: { name: "South Africa", lat: -30.6, lng: 22.9 },
  NG: { name: "Nigeria", lat: 9.1, lng: 8.7 },
  KE: { name: "Kenya", lat: -0.02, lng: 37.9 },
  EG: { name: "Egypt", lat: 26.8, lng: 30.8 },
  AE: { name: "United Arab Emirates", lat: 23.4, lng: 53.8 },
  SA: { name: "Saudi Arabia", lat: 23.9, lng: 45.1 },
  IL: { name: "Israel", lat: 31.0, lng: 34.9 },
  PK: { name: "Pakistan", lat: 30.4, lng: 69.3 },
  BD: { name: "Bangladesh", lat: 23.7, lng: 90.4 },
  ID: { name: "Indonesia", lat: -0.8, lng: 113.9 },
  PH: { name: "Philippines", lat: 12.9, lng: 121.8 },
  VN: { name: "Vietnam", lat: 14.1, lng: 108.3 },
  TH: { name: "Thailand", lat: 15.9, lng: 100.99 },
  MY: { name: "Malaysia", lat: 4.2, lng: 101.98 },
  CL: { name: "Chile", lat: -35.7, lng: -71.5 },
  CO: { name: "Colombia", lat: 4.6, lng: -74.3 },
  PE: { name: "Peru", lat: -9.2, lng: -75.0 },
  DK: { name: "Denmark", lat: 56.3, lng: 9.5 },
  FI: { name: "Finland", lat: 61.9, lng: 25.7 },
  CZ: { name: "Czechia", lat: 49.8, lng: 15.5 },
  RO: { name: "Romania", lat: 45.9, lng: 24.97 },
  HU: { name: "Hungary", lat: 47.2, lng: 19.5 },
  GR: { name: "Greece", lat: 39.1, lng: 21.8 },
};

export function countryName(code: string) {
  return COUNTRY_META[code]?.name || code;
}

export function flagEmoji(code: string | null) {
  if (!code || code.length !== 2) return "·";
  const points = [...code.toUpperCase()].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);
  if (points.some((point) => point < 0x1f1e6 || point > 0x1f1ff)) return "·";
  return String.fromCodePoint(...points);
}
