import type { Status } from "./catalog";
// ref = ID SVS citado no briefing do projeto (ainda não verificado).
export const CATS: { k: string; icon: string; st: Status; href?: string; ref?: number }[] = [
  { k: "climate", icon: "🌡️", st: "available", href: "/experiences/climate" },
  { k: "wildfires", icon: "🔥", st: "available", href: "/experiences/fires", ref: 40531 },
  { k: "air", icon: "💨", st: "validation", ref: 40529 }, { k: "ghg", icon: "☁️", st: "validation", ref: 40477 }, { k: "oceans", icon: "🌊", st: "available", href: "/experiences/oceans", ref: 5101 },
  { k: "water", icon: "💧", st: "soon" }, { k: "sealevel", icon: "📏", st: "soon" }, { k: "biodiversity", icon: "🌿", st: "soon" }, { k: "energy", icon: "⚡", st: "soon" }, { k: "disasters", icon: "🌪️", st: "soon" },
];
