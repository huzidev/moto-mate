export const APP = {
  name: "MotoMate",
  tagline: "Track mileage, fuel, and service for your ride.",
} as const;

export const ROUTES = {
  home: "/",
  signin: "/signin",
  checkEmail: "/signin/check-email",
  dashboard: "/dashboard",
  addMotorbike: "/dashboard/motorbikes/new",
  motorbike: (id: string) => `/dashboard/motorbikes/${id}`,
  logTrip: (id: string) => `/dashboard/motorbikes/${id}/log`,
  recordService: (id: string) => `/dashboard/motorbikes/${id}/service`,
  reminders: (id: string) => `/dashboard/motorbikes/${id}/reminders`,
} as const;

export const VEHICLE_TYPES = {
  motorbike: { label: "Motorbike", enabled: true },
  car: { label: "Car", enabled: false },
} as const;

// ponytail: defaults in constants; move to per-bike settings UI when the reminders page ships
export const SERVICE_DEFAULTS = {
  reminderWindowKm: 100,
} as const;

export const SERVICE_TYPES = {
  OIL_CHANGE: { label: "Oil change", defaultIntervalKm: 1000, defaultMaxDays: 365 },
  TUNE: { label: "Tune / major service", defaultIntervalKm: 3000, defaultMaxDays: null },
  CUSTOM: { label: "Custom", defaultIntervalKm: 1000, defaultMaxDays: null },
} as const;
