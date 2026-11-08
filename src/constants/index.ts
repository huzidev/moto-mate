export const APP = {
  name: "MotoMate",
  tagline: "Track mileage, fuel, and service for your ride.",
} as const;

export const ROUTES = {
  home: "/",
  signin: "/signin",
  signup: "/signup",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
  profile: "/dashboard/profile",
  addMotorbike: "/dashboard/motorbikes/new",
  motorbike: (id: string) => `/dashboard/motorbikes/${id}`,
  editMotorbike: (id: string) => `/dashboard/motorbikes/${id}/edit`,
  logTrip: (id: string) => `/dashboard/motorbikes/${id}/log`,
  editTrip: (id: string, logId: string) => `/dashboard/motorbikes/${id}/log/${logId}`,
  recordService: (id: string) => `/dashboard/motorbikes/${id}/service`,
  editService: (id: string, eventId: string) => `/dashboard/motorbikes/${id}/service/${eventId}`,
  reminders: (id: string) => `/dashboard/motorbikes/${id}/reminders`,
  logFuel: (id: string) => `/dashboard/motorbikes/${id}/fuel`,
  editFuel: (id: string, fuelId: string) => `/dashboard/motorbikes/${id}/fuel/${fuelId}`,
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
