import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OSINT Suite - Domain Intelligence",
  description: "Domain monitoring and OSINT analysis tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}