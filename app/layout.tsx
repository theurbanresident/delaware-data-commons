import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "./components/SiteChrome";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theurbanresident.github.io/delaware-data-commons";
const socialImage = `${siteUrl.replace(/\/$/, "")}/og.png`;
const description = "A community-oriented catalog for discovering, understanding, and tracking public data about Delaware.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Delaware Data Commons",
    template: "%s · Delaware Data Commons",
  },
  description,
  icons: {
    icon: `${siteUrl.replace(/\/$/, "")}/favicon.svg`,
    shortcut: `${siteUrl.replace(/\/$/, "")}/favicon.svg`,
  },
  openGraph: {
    type: "website",
    title: "Delaware Data Commons",
    description,
    images: [{ url: socialImage, width: 1732, height: 909, alt: "Delaware Data Commons — Public evidence, made traceable" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Delaware Data Commons",
    description,
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
