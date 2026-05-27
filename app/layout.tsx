import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Navigation from '@/components/Navigation';
import { Montserrat } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const montserrat = Montserrat({ subsets: ['latin'] });

export const metadata = {
  title: 'Mixiwise',
  description: 'Mixiwise - Split your expenses with your friends and family',
  icons: {
    icon: '/mixi.png',
    apple: '/mixi.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mixiwise',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignInUrl="/groups" afterSignUpUrl="/groups">
      <html lang="en">
        <body className={montserrat.className}>
          <Navigation />
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
