import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NowWhy - Real-time Visitor Intent",
  description: "Know what your visitors are trying to do right now, without dashboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
