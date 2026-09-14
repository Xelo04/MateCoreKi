// ==========================================
// APP: Główny layout aplikacji
// ==========================================
// Plik definiuje strukturę HTML, metadane oraz integruje globalny system
// powiadomień (Sonner) dla całej aplikacji.

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
        {/* Globalne powiadomienia pływające */}
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
