import type { Metadata } from "next";
import "./globals.css";
import { AuthLayoutWrapper } from "./auth-wrapper";

export const metadata: Metadata = {
  title: "Supply Chain Command Center",
  description: "Yard Management, Trailer Security, Demand Planning & AI Intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex bg-slate-50" style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        <AuthLayoutWrapper>{children}</AuthLayoutWrapper>
      </body>
    </html>
  );
}
