import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "DWA Lead Command Center | DUDE Web Agency",
  description: "Internal sales operating system and lead command platform for DUDE Web Agency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090A0F] text-slate-100 min-h-screen flex selection:bg-indigo-500/30">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
