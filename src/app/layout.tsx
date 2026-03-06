import type { Metadata, Viewport } from "next";
import { Comfortaa, Nunito } from "next/font/google";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { Analytics } from "@vercel/analytics/next";
import { stackServerApp } from "@/stack";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Writrospect",
  description: "AI-assisted accountability journal for tracking commitments and patterns",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Writrospect",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${comfortaa.variable} ${nunito.variable} antialiased`}
      >
        <StackProvider app={stackServerApp}>
          <StackTheme>
            <ToastProvider>{children}</ToastProvider>
          </StackTheme>
        </StackProvider>
        <Analytics />
        {/* Figma capture script - temporary */}
        <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async />
      </body>
    </html>
  );
}
