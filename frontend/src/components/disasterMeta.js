import {
  Tornado,
  Flame,
  Wind,
  Snowflake,
  MountainSnow,
  Waves,
  Droplets,
  Mountain,
  CloudHail,
  ThermometerSun,
} from "lucide-react";

export const DISASTER_META = {
  tornado: {
    Icon: Tornado,
    bg: "#6D28D9",
    color: "#7C3AED",
  },
  wildfire: {
    Icon: Flame,
    bg: "#DC2626",
    color: "#EF4444",
  },
  sandstorm: {
    Icon: Wind,
    bg: "#B45309",
    color: "#D97706",
  },
  frost: {
    Icon: Snowflake,
    bg: "#0369A1",
    color: "#0284C7",
  },
  avalanche: {
    Icon: MountainSnow,
    bg: "#1D4ED8",
    color: "#2563EB",
  },
  flood: {
    Icon: Waves,
    bg: "#0F766E",
    color: "#0D9488",
  },
  inundation: {
    Icon: Droplets,
    bg: "#0E7490",
    color: "#0891B2",
  },
  landslide: {
    Icon: Mountain,
    bg: "#92400E",
    color: "#B45309",
  },
  hail: {
    Icon: CloudHail,
    bg: "#4338CA",
    color: "#4F46E5",
  },
  extreme_heat: {
    Icon: ThermometerSun,
    bg: "#EA580C",
    color: "#F97316",
  },
};
