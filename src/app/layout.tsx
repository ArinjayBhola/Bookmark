import type { Metadata } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/lib/query-provider';
import { ClientLayout } from './client-layout';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const merriweather = Merriweather({ weight: ['300', '400', '700', '900'], subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'BookMark',
  description: 'A brutally fast, map-first, personal mountain intelligence system designed for one obsessive explorer.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`}>
      <body className="min-h-screen bg-[#f6f5f2] text-stone-900 font-sans antialiased flex overflow-hidden">
        <QueryProvider>
          <ClientLayout>{children}</ClientLayout>
        </QueryProvider>
      </body>
    </html>
  );
}
