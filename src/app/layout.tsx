// Główny układ aplikacji z metadanymi i globalnymi powiadomieniami.

import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Matcoreki",
  description:
    "Nowoczesna platforma do zarządzania korepetycjami i interaktywnymi zajęciami.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={cn("font-sans", geist.variable)}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        {/* Globalne powiadomienia. */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
