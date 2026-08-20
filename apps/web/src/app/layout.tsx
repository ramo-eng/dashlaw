import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DashLaw — Immigration case management",
  description:
    "Administrative case, checklist, and client document workflows for immigration law firms. Not legal advice.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
