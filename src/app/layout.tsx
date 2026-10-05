import type { Metadata } from "next";
import localFont from "next/font/local";
import { Syne } from "next/font/google";
import { Header } from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
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

const display = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Vera — Intent to settlement for machine-paid APIs",
  description:
    "Agent procurement intelligence: intent, compare, policy, decide, settle, receipt — before any USDC moves.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} font-sans antialiased`}
      >
        <div className="vera-shell min-h-screen">
          <Header />
          {children}
        </div>
        <Toaster richColors closeButton position="top-center" />
      </body>
    </html>
  );
}
