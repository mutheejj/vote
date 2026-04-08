/** @type {import('next').NextConfig} */
const nextConfig = {
  // ========================================
  // PERFORMANCE OPTIMIZATIONS
  // ========================================

  // Turbopack configuration (Next.js 15+)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Enable experimental features for faster builds
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'date-fns', 'recharts'],
    // Faster server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Optimize image loading
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unielect.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.unielect.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Faster image formats
    minimumCacheTTL: 60, // Cache images for better performance
  },

  // Tree-shaking optimization for large libraries (removed lucide-react to prevent icon import issues)
  modularizeImports: {
    'date-fns': {
      transform: 'date-fns/{{member}}',
    },
  },

  // Optimize output for faster builds
  output: 'standalone',

  // Compiler optimizations (only apply when NOT using Turbopack)
  ...(process.env.TURBOPACK !== '1' && {
    compiler: {
      // Remove console logs in production
      removeConsole: process.env.NODE_ENV === 'production',
      // Remove React properties
      reactRemoveProperties: process.env.NODE_ENV === 'production',
    },
  }),

  // Strict mode for better performance
  reactStrictMode: true,

  // Disable x-powered-by header
  poweredByHeader: false,

  // Production source maps (disable for faster builds)
  productionBrowserSourceMaps: false,

  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ]
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
    ]
  },

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize webpack for faster builds
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }

    // Enable caching for faster rebuilds
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    }

    // Optimize module resolution
    config.resolve.symlinks = false

    // Split chunks for better caching
    if (!isServer && !dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk for node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Commons chunk for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // UI libraries chunk
            ui: {
              name: 'ui',
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion)[\\/]/,
              chunks: 'all',
              priority: 30,
            },
          },
        },
      }
    }

    // Optimize rebuilds in development
    if (dev) {
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
    }

    return config
  },

  typescript: {
    // Type checking during build
    ignoreBuildErrors: false,
  },

  eslint: {
    // ESLint during build
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig