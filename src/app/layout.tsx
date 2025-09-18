import type { Metadata } from "next";
import "./globals.css";
import "@/styles/design-tokens.css";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { ClientThemeProvider } from "@/lib/theme/ClientThemeProvider";
import { AccessibilityProvider } from "@/components/ui";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import { AuthProvider } from "@/lib/auth";
import { GlobalErrorBoundary } from "@/components/ErrorBoundary/GlobalErrorBoundary";

// Next.js 14+ 권장: viewport 별도 export
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
  themeColor: "#3B82F6"
};

export const metadata: Metadata = {
  title: "Weave - AI 기반 비즈니스 ERP",
  description: "독립 비즈니스를 위한 개인화 AI 기반 ERP 시스템",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  // viewport는 별도 export로 분리됨
  appleWebApp: {
    statusBarStyle: "default",
    title: "Weave"
  },
  other: {
    "mobile-web-app-capable": "yes"
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
        <GlobalErrorBoundary
          level="global"
          enableRetry={true}
          maxRetries={3}
          autoRecover={false}
        >
          <AccessibilityProvider>
            <ClientThemeProvider>
              <AuthProvider>
                {children}
                {process.env.NODE_ENV === 'development' && (
                  <PerformanceMonitor compact position="bottom-right" />
                )}
              </AuthProvider>
            </ClientThemeProvider>
          </AccessibilityProvider>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
