import type { Metadata } from 'next';
import './globals.css';
import { BottomNav } from '@/components/layout/bottom-nav';

export const metadata: Metadata = {
  title: 'PickRank',
  description: 'Skill-based NFL pick-order contests.',
  icons: {
    icon: '/brand/pickrank-app-icon.png',
    apple: '/brand/pickrank-app-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto min-h-screen max-w-md px-4 pb-24 pt-6">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
