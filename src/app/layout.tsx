import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: "RefLink",
  description: "地域サッカー審判マッチングプラットフォーム",
  manifest: "/manifest.json",
  openGraph: {
    title: "RefLink",
    description: "地域サッカー審判マッチングプラットフォーム",
    type: "website",
    locale: "ja_JP",
    siteName: "RefLink",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "RefLink",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icon-32.png", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
