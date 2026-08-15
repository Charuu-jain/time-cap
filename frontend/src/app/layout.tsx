import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PostHogProvider from './PostHogProvider';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VaultPay | Secure Stellar Escrow',
  description:
    'Level 4 production-grade Stellar Soroban multi-sig escrow dApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PostHogProvider />
        <Analytics />
        <nav className="w-full bg-slate-900 text-white p-4 shadow-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">VaultPay.</h1>
          </div>
        </nav>
        <main className="w-full h-full bg-zinc-50">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </body>
    </html>
  );
}
