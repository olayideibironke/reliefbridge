import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://reliefbridge.net"),

  title: {
    default: "ReliefBridge — Disaster Recovery Coordination Platform",
    template: "%s | ReliefBridge",
  },

  description:
    "ReliefBridge helps disaster recovery organizations coordinate survivor cases, unmet needs, referrals, partner activity, and recovery outcomes.",

  applicationName: "ReliefBridge",

  authors: [{ name: "ReliefBridge Team" }],

  creator: "ReliefBridge",
  publisher: "ReliefBridge",

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "ReliefBridge",
    title: "ReliefBridge — Disaster Recovery Coordination Platform",
    description:
      "Coordinate survivor cases, unmet needs, partner referrals, and disaster recovery outcomes in one secure platform.",
  },

  twitter: {
    card: "summary_large_image",
    title: "ReliefBridge — Disaster Recovery Coordination Platform",
    description:
      "Coordinate survivor cases, unmet needs, partner referrals, and disaster recovery outcomes in one secure platform.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#112E51",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-w-0 overflow-x-hidden bg-surface text-ink antialiased">
        {children}
      </body>
    </html>
  );
}