import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Nexus CRM - Bowman Bathrooms",
  description: "Enterprise CRM platform for premium bathroom renovations",
  keywords: ["CRM", "bathroom renovation", "project management", "Bowman Bathrooms"],
  authors: [{ name: "Bowman Bathrooms" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow", // Private CRM system
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
