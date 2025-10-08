import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from './providers';
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Orbitron",
  description: "P2P Application",
  icons: {
    icon: "/carbon_shape-exclude.svg" 
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black text-white">
        <Providers>{children}</Providers>
        <Analytics/>
      </body>
    </html>
  );
}
