import { Metadata } from 'next';
import { headers } from 'next/headers';
import ClawMoreClient from './ClawMoreClient';
import { getDictionary } from '../lib/get-dictionary';

export const metadata: Metadata = {
  title: 'ClawMore - Scale Your Agency with AI Content Operations',
  description:
    'Automate high-quality content production with AI. ClawMore helps agencies deliver personalized, conversion-focused content at 10x speed with 90% lower costs.',
  openGraph: {
    title: 'ClawMore - Scale Your Agency with AI Content Operations',
    description:
      'Automate high-quality content production with AI. Scale your content agency and deliver outsized results with AI-driven workflows.',
    url: 'https://clawmore.com',
    siteName: 'ClawMore',
    images: [
      {
        url: 'https://clawmore.com/logo-text-raw-1024.png',
        width: 1024,
        height: 1024,
        alt: 'ClawMore Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClawMore - Scale Your Agency with AI Content Operations',
    description:
      'Automate high-quality content production with AI content operations.',
    images: ['https://clawmore.com/logo-text-raw-1024.png'],
    creator: '@clawmore',
  },
  alternates: {
    canonical: 'https://clawmore.com',
  },
};

export default async function ClawMorePage() {
  const headerList = await headers();
  const locale = headerList.get('X-NEXT-LOCALE') || 'en';
  const dictionary = await getDictionary(locale);
  // Use environment variable which SST correctly injects at runtime
  const apiUrl = process.env.LEAD_API_URL || '';

  return <ClawMoreClient apiUrl={apiUrl} dict={dictionary} />;
}
