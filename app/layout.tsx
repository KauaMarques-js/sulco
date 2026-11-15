import "leaflet/dist/leaflet.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import AppProvider from "../components/AppProvider";
import Header from "../components/Header";
import A11yDialog from "../components/A11yDialog";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: { default: "SULCO — the planet, in sound", template: "%s · SULCO" },
  description: "SULCO turns NASA Earth science data into sound you can hear and see. Explore 140+ years of climate records and near-real-time wildfire detections.",
  applicationName: "SULCO",
  keywords: ["NASA", "sonification", "climate", "GISTEMP", "FIRMS", "accessibility", "data visualization", "Space Apps"],
  openGraph: {
    title: "SULCO — the planet, in sound",
    description: "NASA Earth data, pressed into sound. Hear 140+ years of climate change and live wildfire activity.",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "SULCO — the planet, in sound" },
};

export const viewport: Viewport = {
  themeColor: "#05060b",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProvider>
          <Header />
          <main id="main" tabIndex={-1}>{children}</main>
          <Footer />
          <A11yDialog />
        </AppProvider>
      </body>
    </html>
  );
}
