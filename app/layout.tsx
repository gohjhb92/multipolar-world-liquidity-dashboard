import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Multipolar World Liquidity Dashboard",
  description: "A geopolitical-financial dashboard for dollar, yuan, and hedging liquidity blocs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
