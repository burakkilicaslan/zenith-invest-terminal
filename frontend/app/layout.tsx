import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Zenith Invest Terminal — Makro Panosu",
  description:
    "ABD ve Türkiye makro göstergelerini birlikte izlemek için Zenith Invest Terminal makro stratejisi panosu.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <div className="app-shell">{children}</div>
      </body>
    </html>
  );
}
