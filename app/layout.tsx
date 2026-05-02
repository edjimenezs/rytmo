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
      <body className="min-h-screen bg-[#0d1117] antialiased text-[#e6edf3] pb-16">
        <SessionProvider>
          {children}
          <BottomNav />
        </SessionProvider>
      </body>
    </html>
  );
}
