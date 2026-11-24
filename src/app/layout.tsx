import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSINT Suite",
  description: "Domain reconnaissance & intelligence",
  robots: "noindex, nofollow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background mono antialiased">
        {children}
      </body>
    </html>
  );
}