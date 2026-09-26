import type { Metadata } from 'next';
import './globals.css';
import { siteConfig } from '@/site.config';
import { AuthProvider } from '@/components/auth/auth-context';
import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — Zero-Trust API Vulnerability Scanner`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    'API security',
    'BOLA scanner',
    'IDOR vulnerability detector',
    'OpenAPI 3.0 vulnerability testing',
    'Excessive data exposure',
    'API rate limiting audit',
    'Zero-trust API security',
    'OWASP API Top 10',
  ],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — ${siteConfig.tagline}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ['/og-image.png'],
    creator: '@vanguard_api',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // JSON-LD structured data for search engines
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteConfig.url}/#organization`,
        name: siteConfig.name,
        url: siteConfig.url,
        logo: `${siteConfig.url}/icon.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          email: siteConfig.contact.securityEmail,
          contactType: 'security technical support',
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: siteConfig.name,
        applicationCategory: 'SecuritySoftware',
        operatingSystem: 'Cross-platform, Web, CLI',
        description: siteConfig.description,
        offers: {
          '@type': 'Offer',
          price: '0.00',
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    ],
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-obsidian text-muted-heading font-sans antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
