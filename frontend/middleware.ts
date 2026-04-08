import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory cache for auth verification (30 second TTL)
const authCache = new Map<string, { verified: boolean; user: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Cleanup expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of authCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      authCache.delete(token);
    }
  }
}, 60000); // Clean up every minute

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip middleware for API routes, static files, and assets
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') // Files with extensions (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/verify-email',
    '/password-reset',
    '/set-password', // Candidate password setup after approval (route group doesn't create URL segment)
    '/system/auth' // Admin login page - public but with role-based redirect
  ];

  // Routes that start with these paths are also public
  const publicRoutePrefixes = [
    '/register' // Allows /register/candidate, /register/candidate/complete, /register/admin
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname === route) ||
                        publicRoutePrefixes.some(prefix => pathname.startsWith(prefix));

  // If it's a public route, allow access without any checks
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = req.cookies.get('unielect-voting-access-token')?.value;

  // If user is not authenticated and trying to access protected route
  if (!token) {
    console.warn('[Middleware] No token found for protected route, allowing page to handle auth');
    // Instead of redirecting, let the page handle authentication
    // This prevents redirect loops and allows users to access login pages
    return NextResponse.next();
  }

  // Check cache first to avoid redundant API calls
  const now = Date.now();
  const cached = authCache.get(token);

  let user: any;

  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    // Use cached verification (valid for 30 seconds)
    console.log('[Middleware] Using cached auth verification');
    user = cached.user;
  } else {
    // Verify token with backend (cache miss or expired)
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        // Reduced timeout for faster feedback
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });

      if (!response.ok) {
        // Token is invalid, clear it and cache
        console.warn('[Middleware] Invalid token, clearing and allowing page to handle auth');
        authCache.delete(token);
        const redirectResponse = NextResponse.next();
        redirectResponse.cookies.delete('unielect-voting-access-token');
        return redirectResponse;
      }

      const data = await response.json();
      user = data.data;

      // Cache the verification result
      authCache.set(token, {
        verified: true,
        user,
        timestamp: now
      });

      console.log('[Middleware] Auth verified and cached');
    } catch (error) {
      console.error('[Middleware] Auth verification error:', error);

      // Check if it's a network/timeout error
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('fetch') || error.message.includes('network')) {
          // Network error - allow request to proceed to avoid blocking the app
          // The frontend will handle authentication on the page level
          console.warn('[Middleware] Network error during auth check, allowing request to proceed');
          return NextResponse.next();
        }
      }

      // For other errors (invalid token format, etc.), clear cookie and let page handle auth
      console.warn('[Middleware] Auth error, clearing token and allowing page to handle auth');
      authCache.delete(token);
      const redirectResponse = NextResponse.next();
      redirectResponse.cookies.delete('unielect-voting-access-token');
      return redirectResponse;
    }
  }

    // Role-based access control
    const userRole = user.role;

    // Admin routes - only accessible by ADMIN, SUPER_ADMIN, and MODERATOR
    if (pathname.startsWith('/admin')) {
      const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'];
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Super admin exclusive routes
    if (pathname.startsWith('/admin/settings') ||
        pathname.startsWith('/admin/audit') ||
        pathname.includes('/delete') ||
        pathname.includes('/backup')) {
      if (userRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin/dashboard', req.url));
      }
    }

    // Voter routes - accessible by all authenticated users
    if (pathname.startsWith('/dashboard') ||
        pathname.startsWith('/elections') ||
        pathname.startsWith('/vote') ||
        pathname.startsWith('/results') ||
        pathname.startsWith('/history')) {
      // All authenticated users can access voter routes
      return NextResponse.next();
    }

    // Email verification check for sensitive operations (VOTERS ONLY)
    // Admins don't need email verification for admin operations
    const isVerified = user.isVerified;
    const voterSensitiveRoutes = ['/vote/'];

    if (voterSensitiveRoutes.some(route => pathname.startsWith(route)) && !isVerified) {
      const verifyUrl = new URL('/verify-email', req.url);
      verifyUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(verifyUrl);
    }

    // Two-factor authentication check for admin operations
    // NOTE: 2FA requirement is optional for now - can be enabled later
    // const twoFactorEnabled = user.twoFactorEnabled;
    // const adminSensitiveRoutes = [
    //   '/admin/settings',
    //   '/admin/audit',
    //   '/admin/voters/import',
    //   '/admin/elections/create'
    // ];

    // if (adminSensitiveRoutes.some(route => pathname.startsWith(route)) &&
    //     ['ADMIN', 'SUPER_ADMIN'].includes(userRole) &&
    //     !twoFactorEnabled) {
    //   const setup2faUrl = new URL('/admin/settings/security', req.url);
    //   setup2faUrl.searchParams.set('require2fa', 'true');
    //   setup2faUrl.searchParams.set('callbackUrl', pathname);
    //   return NextResponse.redirect(setup2faUrl);
    // }

    return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|images|fonts|site.webmanifest|sw.js).*)',
  ],
};
