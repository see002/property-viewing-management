import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { AppProviders } from "./providers";
import { AppHeader } from "@/components/layout/AppHeader";

const manrope = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://vistamanage.local"),
  title: {
    default: "VistaManage — Property Viewing Management",
    template: "%s — VistaManage",
  },
  description:
    "Schedule, manage, and track property viewing slots. Tokenized invites, clear statuses, great UX.",
  applicationName: "VistaManage",
  keywords: ["property viewings", "scheduling", "invites", "slots", "real estate"],
  openGraph: {
    type: "website",
    siteName: "VistaManage",
    title: "VistaManage — Property Viewing Management",
    description:
      "Schedule, manage, and track property viewing slots. Tokenized invites, clear statuses, great UX.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "VistaManage — Property Viewing Management",
    description:
      "Schedule, manage, and track property viewing slots. Tokenized invites, clear statuses, great UX.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${geistMono.variable} antialiased`}>
        <AppProviders>
          <AppHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
