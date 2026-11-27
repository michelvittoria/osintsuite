import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "OSINT Suite terms of service — free, open source, MIT licensed, for authorized reconnaissance only.",
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
