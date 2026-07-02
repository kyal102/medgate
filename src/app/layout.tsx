import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedGate — Deterministic Medical Verification Gates",
  description:
    "MedGate: Deterministic verification gates that catch medical errors before they reach patients — substrate-agnostic, patent-protected, life-saving. Built on DTL (AU 2026905289).",
  keywords: [
    "MedGate",
    "medical verification",
    "drug interaction",
    "dose verification",
    "clinical decision support",
    "deterministic",
    "DTL",
    "patient safety",
    "healthcare AI",
    "gate system",
  ],
  authors: [{ name: "MedGate Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "MedGate — Deterministic Medical Verification Gates",
    description:
      "Before any medical claim reaches a patient, it must pass through a deterministic verification gate.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
