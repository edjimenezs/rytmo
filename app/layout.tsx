import type { Metadata } from "next";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import BottomNav from "@/components/layout/BottomNav";

export const metadata: Metadata = {
  title: "RytMo - Nutrition for endurance training",
  description:
    "Daily fueling recommendations for endurance athletes backed by Strava, TrainingPeaks and Garmin data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-indigo-50 antialiased text-slate-900 pb-16">
        <SessionProvider>
          {children}
          <BottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
