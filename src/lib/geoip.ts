// GeoIP resolution using Cloudflare headers or fallback
// In production, Cloudflare automatically adds geo headers

export interface GeoData {
  country: string | null;
  city: string | null;
}

export function getGeoFromHeaders(headers: Headers): GeoData {
  // Cloudflare headers (when deployed behind Cloudflare)
  const cfCountry = headers.get('cf-ipcountry');
  const cfCity = headers.get('cf-ipcity');

  // Vercel headers (when deployed on Vercel)
  const vercelCountry = headers.get('x-vercel-ip-country');
  const vercelCity = headers.get('x-vercel-ip-city');

  return {
    country: cfCountry || vercelCountry || null,
    city: cfCity || vercelCity || null,
  };
}

// Map country codes to country names (common ones for display)
const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  CN: 'China',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  RU: 'Russia',
  KR: 'South Korea',
  SG: 'Singapore',
  HK: 'Hong Kong',
  NZ: 'New Zealand',
  IE: 'Ireland',
  CH: 'Switzerland',
  AT: 'Austria',
  BE: 'Belgium',
  PT: 'Portugal',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  ZA: 'South Africa',
  IL: 'Israel',
  AE: 'UAE',
  TW: 'Taiwan',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  ID: 'Indonesia',
  MY: 'Malaysia',
};

export function getCountryName(code: string | null): string {
  if (!code) return 'Unknown';
  return countryNames[code.toUpperCase()] || code;
}

// Format location for display
export function formatLocation(country: string | null, city: string | null): string {
  if (city && country) {
    return `${city}, ${getCountryName(country)}`;
  }
  if (country) {
    return getCountryName(country);
  }
  return 'Unknown location';
}
