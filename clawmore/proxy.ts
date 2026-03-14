import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['en', 'zh'];
const defaultLocale = 'en';
const COOKIE_NAME = 'NEXT_LOCALE';

function getLocale(request: NextRequest) {
  // 1. Check cookie
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Check CloudFront header for China
  const country = request.headers.get('cloudfront-viewer-country');
  if (country === 'CN') {
    return 'zh';
  }

  // 3. Check Accept-Language header with priority
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const parsedLanguages = acceptLanguage
      .split(',')
      .map((lang) => {
        const [code, qVal] = lang.trim().split(';q=');
        return {
          code: code.split('-')[0].toLowerCase(),
          priority: qVal ? parseFloat(qVal) : 1.0,
        };
      })
      .sort((a, b) => b.priority - a.priority);

    for (const lang of parsedLanguages) {
      if (locales.includes(lang.code)) {
        return lang.code;
      }
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip public files and API routes
  if (
    [
      '/favicon.ico',
      '/logo.png',
      '/hero.png',
      '/robots.txt',
      '/sitemap.xml',
    ].includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    return;
  }

  const locale = getLocale(request);
  const response = NextResponse.next();

  // Set the cookie if it's not present or different
  if (request.cookies.get(COOKIE_NAME)?.value !== locale) {
    response.cookies.set(COOKIE_NAME, locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // Pass the locale to the app via a custom header
  response.headers.set('X-NEXT-LOCALE', locale);

  return response;
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
