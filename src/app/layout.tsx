import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Órbita CRM",
  description: "Sistema de gestión de clientes, cotizaciones y recibos",
  icons: [{ rel: "icon", url: "/favicon.svg", type: "image/svg+xml" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
