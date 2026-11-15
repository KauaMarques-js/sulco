import type { ReactNode, SVGProps } from "react";

export type IconName =
  | "play" | "pause" | "stop" | "restart" | "arrow" | "globe" | "flame"
  | "waves" | "thermo" | "spark" | "access" | "menu" | "close" | "external"
  | "check" | "download" | "sound" | "data" | "clock" | "source" | "info"
  | "volume" | "chevron" | "wind" | "cloud" | "drop" | "leaf" | "bolt" | "storm" | "ruler";

const paths: Record<IconName, ReactNode> = {
  play: <path d="M8 5.5v13l11-6.5-11-6.5Z" fill="currentColor" stroke="none" />,
  pause: <><path d="M9 5v14M15 5v14" strokeWidth="2.2" /></>,
  stop: <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none" />,
  restart: <><path d="M4.5 10a7.5 7.5 0 1 1 1.6 6.4" /><path d="M4.2 4.6V10h5.4" /></>,
  arrow: <><path d="M4.5 12h15" /><path d="m13.5 6 6 6-6 6" /></>,
  globe: <><circle cx="12" cy="12" r="8.2" /><path d="M3.8 12h16.4" /><path d="M12 3.8c2.4 2.3 3.6 5.1 3.6 8.2S14.4 18.1 12 20.2C9.6 18.1 8.4 15.1 8.4 12S9.6 6.1 12 3.8Z" /></>,
  flame: <path d="M12 21c3.6 0 6.2-2.5 6.2-5.9 0-2.1-1.1-3.9-2.5-5.3-.7-.7-1.3-1.8-1.4-3.1-.1-.6-.7-1-1.2-.7-2 .9-3.4 2.7-3.9 4.6-.2.7-.9.9-1.4.5-.4-.3-.7-.8-.9-1.4-.2-.6-1-.7-1.3-.2C5.9 11 5.8 12.7 5.8 15c0 3.4 2.6 6 6.2 6Z" />,
  waves: <><path d="M3 8.5c1.8-1.6 3.7-1.6 5.5 0s3.7 1.6 5.5 0 3.7-1.6 5.5 0" /><path d="M3 13c1.8-1.6 3.7-1.6 5.5 0s3.7 1.6 5.5 0 3.7-1.6 5.5 0" /><path d="M3 17.5c1.8-1.6 3.7-1.6 5.5 0s3.7 1.6 5.5 0 3.7-1.6 5.5 0" /></>,
  thermo: <><path d="M14 14.8V5.5a2 2 0 0 0-4 0v9.3a4.2 4.2 0 1 0 4 0Z" /><path d="M12 8.5v7.2" /><path d="M17.5 6h2.8M17.5 10h2.8M17.5 14h2.8" opacity=".55" /></>,
  spark: <><path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7L4.5 11 10.1 9 12 3.5Z" /><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></>,
  access: <><circle cx="12" cy="4.7" r="1.7" /><path d="M5.5 8.2c4.3 1.4 8.7 1.4 13 0" /><path d="M12 8.8v5.4" /><path d="m12 14.2-3.6 6M12 14.2l3.6 6" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="2" />,
  close: <path d="M6 6l12 12M18 6 6 18" strokeWidth="2" />,
  external: <><path d="M14 4.5h5.5V10" /><path d="M19.2 4.8 11 13" /><path d="M18.5 14.5v4a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" /></>,
  check: <path d="m5 12.8 4.2 4.2L19 6.5" strokeWidth="2.2" />,
  download: <><path d="M12 4v10.5" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M4.5 19.5h15" /></>,
  sound: <><path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" /><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.5a8 8 0 0 1 0 11" /></>,
  data: <><ellipse cx="12" cy="6" rx="7.2" ry="3" /><path d="M4.8 6v6c0 1.7 3.2 3 7.2 3s7.2-1.3 7.2-3V6" /><path d="M4.8 12v6c0 1.7 3.2 3 7.2 3s7.2-1.3 7.2-3v-6" /></>,
  clock: <><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5V12l3 2" /></>,
  source: <><path d="M4 5.5h7v6H4zM13 12.5h7v6h-7z" /><path d="M7.5 11.5v3.5h5.5M13 12.5V9" opacity=".6" /></>,
  info: <><circle cx="12" cy="12" r="8.2" /><path d="M12 11v5.5" /><circle cx="12" cy="8" r=".9" fill="currentColor" stroke="none" /></>,
  volume: <><path d="M4 9.5h3.2L12 5.5v13L7.2 14.5H4a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" /><path d="M15.5 9a4.2 4.2 0 0 1 0 6" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
  wind: <><path d="M3.5 8.5h11a2.5 2.5 0 1 0-2.4-3.2" /><path d="M3.5 12.5h15a2.5 2.5 0 1 1-2.4 3.2" /><path d="M3.5 16.5h7" /></>,
  cloud: <><path d="M7 18.5h9.5a3.5 3.5 0 0 0 .4-7 5.5 5.5 0 0 0-10.5-1.2A4.2 4.2 0 0 0 7 18.5Z" /><path d="M9 21h6" opacity=".5" /></>,
  drop: <path d="M12 3.5c3.2 3.7 5.8 6.9 5.8 10.1A5.8 5.8 0 0 1 12 19.4a5.8 5.8 0 0 1-5.8-5.8C6.2 10.4 8.8 7.2 12 3.5Z" />,
  leaf: <><path d="M5 19C4.2 12 8.4 5.5 19.5 4.5 19 15.3 13.6 19.8 5 19Z" /><path d="M4 20c3.2-5 7.1-8.4 12.4-10.6" /></>,
  bolt: <path d="M13.2 3 5.5 13.4h5.2L10 21l7.6-10.4h-5.1L13.2 3Z" />,
  storm: <><path d="M7 15.5h9.5a3.5 3.5 0 0 0 .4-7 5.5 5.5 0 0 0-10.5-1.2A4.2 4.2 0 0 0 7 15.5Z" /><path d="m12.5 15-2.5 4h4l-1.5 3" /></>,
  ruler: <><path d="M3.5 8.5 8.5 3.5l12 12-5 5z" /><path d="m8 8 1.6 1.6M11 11l1.6 1.6M14 14l1.6 1.6" /></>,
};

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}

/** SULCO brand mark: a record seen from above, with a data cut into the groove. */
export function Mark({ size = 30 }: { size?: number }) {
  return (
    <svg className="mark" width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sulco-mark" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7fe7ff" />
          <stop offset="1" stopColor="#b49bff" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="17" stroke="url(#sulco-mark)" strokeWidth="1.4" opacity=".55" />
      <circle cx="20" cy="20" r="12.6" stroke="url(#sulco-mark)" strokeWidth="1" opacity=".35" />
      <circle cx="20" cy="20" r="8.2" stroke="url(#sulco-mark)" strokeWidth="1" opacity=".25" />
      <circle cx="20" cy="20" r="3.1" fill="url(#sulco-mark)" />
      <path d="M20 3v9.2a7.8 7.8 0 0 1 7.4 5.1" stroke="#eef2fd" strokeWidth="1.5" strokeLinecap="round" opacity=".85" />
      <circle cx="20" cy="3" r="1.6" fill="#eef2fd" />
    </svg>
  );
}
