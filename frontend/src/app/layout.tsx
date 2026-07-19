import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Katalog Open Source IT Tools',
  description:
    'Katalog lengkap tool IT open-source untuk keamanan jaringan, DevOps, monitoring, CI/CD, dan lainnya. Dilengkapi rekomendasi AI.',
  keywords: [
    'IT tools',
    'open source',
    'security',
    'DevOps',
    'monitoring',
    'katalog',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <div className="mesh-bg" />
        {children}
      </body>
    </html>
  );
}
