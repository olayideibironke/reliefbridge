import type { Metadata, Viewport } from "next";
import { Public_Sans, Merriweather } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const merriweather = Merriweather({
  subsets: ["latin"],
  variable: "--font-merriweather",
  display: "swap",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "ReliefBridge — Disaster Recovery Coordination Platform",
  description:
    "ReliefBridge is the coordination platform for long-term disaster recovery. Helping nonprofits, churches, recovery groups, and case managers coordinate survivor cases, unmet needs, referrals, partner activity, and recovery outcomes. A Westforge Holdings platform.",
  applicationName: "ReliefBridge",
  authors: [{ name: "Westforge Holdings" }],
};

export const viewport: Viewport = {
  themeColor: "#112E51",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${publicSans.variable} ${merriweather.variable}`}
    >
      <body className="bg-surface text-ink antialiased">{children}</body>
    </html>
  );
}
