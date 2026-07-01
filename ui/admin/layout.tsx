// src/app/layout.tsx
import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/lib/theme-context';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Sindh Online School — Admin',
  description: 'Admin dashboard for Sindh Online School',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${dmSans.variable} font-sans antialiased`} style={{ background: 'var(--bg-base)' }}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontFamily: 'DM Sans, sans-serif',
                  boxShadow: 'var(--shadow-card)',
                },
                success: {
                  duration: 3000,
                  iconTheme: { primary: '#10b981', secondary: '#fff' },
                },
                error: {
                  duration: 4000,
                  iconTheme: { primary: '#f43f5e', secondary: '#fff' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}