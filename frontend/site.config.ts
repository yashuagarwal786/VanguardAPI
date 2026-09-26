/**
 * VanguardAPI — Global Site Configuration
 * Single source of truth for all brand, contact, social, and feature flags.
 * No value is hardcoded twice across the codebase.
 */

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export interface SiteConfig {
  name: string;
  legalName: string;
  tagline: string;
  description: string;
  url: string;
  links: {
    github: string;
    twitter: string;
    discord: string;
    docs: string;
  };
  contact: {
    email: string;
    securityEmail: string;
  };
  navigation: NavItem[];
  footer: {
    product: NavItem[];
    resources: NavItem[];
    legal: NavItem[];
  };
  beta: {
    isPublicBeta: boolean;
    bannerText: string;
  };
}

export const siteConfig: SiteConfig = {
  name: 'VanguardAPI',
  legalName: 'VanguardAPI Technologies Inc.',
  tagline: 'Find the API vulnerability before the breach headline does.',
  description:
    'Production-grade, zero-trust API security platform. Discover Broken Object Level Authorization (BOLA), unmasked credential leaks, and missing rate limits from your OpenAPI contracts before attackers do.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://vanguard-api.io',
  links: {
    github: 'https://github.com/vanguard-api/vanguard-api',
    twitter: 'https://twitter.com/vanguard_api',
    discord: 'https://discord.gg/vanguard-api',
    docs: '/docs',
  },
  contact: {
    email: 'hello@vanguard-api.io',
    securityEmail: 'security@vanguard-api.io',
  },
  navigation: [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Threat Graph', href: '/graph' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Contact', href: '/contact' },
  ],
  footer: {
    product: [
      { label: 'Platform Features', href: '/features' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Pricing & Beta', href: '/pricing' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    resources: [
      { label: 'Getting Started Guide', href: '/docs' },
      { label: 'OpenAPI Spec Format', href: '/docs#openapi' },
      { label: 'Verification Protocol', href: '/docs#verification' },
      { label: 'GitHub Repository', href: 'https://github.com/vanguard-api/vanguard-api', external: true },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Acceptable Use Policy', href: '/acceptable-use' },
      { label: 'Security Disclosures', href: 'mailto:security@vanguard-api.io' },
    ],
  },
  beta: {
    isPublicBeta: true,
    bannerText: 'VanguardAPI is currently in Free Public Beta for authorized engineering teams.',
  },
};
