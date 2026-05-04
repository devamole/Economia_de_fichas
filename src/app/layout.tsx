import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: {
    default: "Fichas & Premios",
    template: "%s | Fichas & Premios",
  },
  description: "App de economía de puntos familiar",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fichas & Premios",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
