import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { ClientLayout } from './client-layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Terrain Vault',
  description: 'A private terrain archive for saved mountain discoveries, media, routes, and expedition notes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <body className="flex min-h-screen overflow-hidden bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <QueryProvider>
          <ClientLayout>{children}</ClientLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
