import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers/Providers"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils/cn"

// Inter - Modern professional font for the entire application
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap"
})

export const metadata: Metadata = {
  title: {
    default: "UniElect Voting System",
    template: "%s | UniElect Voting System"
  },
  description: "A secure and transparent blockchain-based voting system for university student elections.",
  keywords: [
    "UniElect",
    "voting",
    "elections",
    "blockchain",
    "student council",
    "university elections",
    "secure voting"
  ],
  authors: [
    {
      name: "UniElect Development Team",
      url: "https://unielect.com"
    }
  ],
  creator: "UniElect Development Team",
  publisher: "UniElect",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    title: "UniElect Voting System",
    description: "A secure and transparent blockchain-based voting system for university student elections.",
    siteName: "UniElect Voting System",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "UniElect Voting System"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "UniElect Voting System",
    description: "A secure and transparent blockchain-based voting system for university student elections.",
    images: ["/og-image.png"],
    creator: "@unielect_official"
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  }
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#528068" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#528068" />
        <meta name="msapplication-TileColor" content="#528068" />
        <meta name="application-name" content="UniElect Voting" />
        <meta name="apple-mobile-web-app-title" content="UniElect Voting" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Content Security Policy */}
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:* https:; media-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self';"
        />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
        suppressHydrationWarning
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <main className="flex-1">
              {children}
            </main>
          </div>

          {/* Toast Notifications */}
          <Toaster />

          {/* Accessibility Skip Link */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-sage-600 focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2"
          >
            Skip to main content
          </a>
        </Providers>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
            `,
          }}
        />

        {/* Analytics */}
        {process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    anonymize_ip: true,
                    respect_privacy: true
                  });
                `,
              }}
            />
          </>
        )}

        {/* Emergency Banner (conditionally shown) */}
        {process.env.NEXT_PUBLIC_EMERGENCY_BANNER && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center py-2 px-4 text-sm">
            <strong>System Notice:</strong> {process.env.NEXT_PUBLIC_EMERGENCY_BANNER}
          </div>
        )}
      </body>
    </html>
  )
}