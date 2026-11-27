import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How OSINT Suite works: the scan flow, the 20 reconnaissance modules, privacy by design, and fair-use limits.",
  alternates: { canonical: "/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
