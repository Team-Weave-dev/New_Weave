import type { Metadata } from "next";
import "./globals.css";
import "@/styles/design-tokens.css";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ClientThemeProvider } from "@/lib/theme/ClientThemeProvider";
import { AccessibilityProvider } from "@/components/ui";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

export const metadata: Metadata = {
  title: "Weave - AI 기반 비즈니스 ERP",
  description: "독립 비즈니스를 위한 개인화 AI 기반 ERP 시스템",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover"
  },
  themeColor: "#3B82F6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Weave"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="dark">
      <body className="antialiased font-primary">
        <AccessibilityProvider>
          <ClientThemeProvider>
            {children}
            {process.env.NODE_ENV === 'development' && (
              <PerformanceMonitor compact position="bottom-right" />
            )}
          </ClientThemeProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
