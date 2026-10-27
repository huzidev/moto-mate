export const APP = {
  name: "MotoMate",
  tagline: "Track mileage, fuel, and service for your ride.",
} as const;

export const ROUTES = {
  home: "/",
  signin: "/signin",
  dashboard: "/dashboard",
  addMotorbike: "/dashboard/motorbikes/new",
} as const;

export const VEHICLE_TYPES = {
  motorbike: { label: "Motorbike", enabled: true },
  car: { label: "Car", enabled: false },
} as const;

// ponytail: defaults in constants; move to per-user settings when multi-user ships
export const SERVICE_DEFAULTS = {
  oilChangeKm: 1000,
  tuneKm: 3000,
  reminderWindowKm: 100,
} as const;
