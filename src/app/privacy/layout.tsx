import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "OSINT Suite privacy policy — no personal data collected, static analysis only, no tracking.",
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
