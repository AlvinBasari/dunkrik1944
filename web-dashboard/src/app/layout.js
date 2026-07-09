import "./globals.css";

export const metadata = {
  title: "🐔 Mercusuar Smart Chicken Farm - Agri-Tech Control Center",
  description: "Platform Monitoring & Otomatisasi Kandang Ayam Cerdas berbasis IoT",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className="antialiased bg-slate-50 text-slate-800 font-sans">
        {children}
      </body>
    </html>
  );
}
