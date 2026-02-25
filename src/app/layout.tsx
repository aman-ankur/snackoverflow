import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "SnackOverflow — AI Nutrition Tracker",
  description: "AI-powered nutrition tracking for Indian food. Scan dishes or describe meals in Hindi-English to get instant nutrition info with a fun capybara companion.",
  openGraph: {
    title: "SnackOverflow — AI Nutrition Tracker",
    description: "AI-powered nutrition tracking for Indian food. Scan dishes or describe meals in Hindi-English to get instant nutrition info with a fun capybara companion.",
    siteName: "SnackOverflow",
    type: "website",
    images: [
      {
        url: "/model/capy-coconut.jpeg",
        width: 225,
        height: 225,
        alt: "SnackOverflow capybara mascot with coconut water",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SnackOverflow — AI Nutrition Tracker",
    description: "AI-powered nutrition tracking for Indian food. Scan dishes or describe meals in Hindi-English to get instant nutrition info with a fun capybara companion.",
    images: ["/model/capy-coconut.jpeg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5F2EB",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${jetBrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
