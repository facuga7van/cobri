import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ TypeScript and ESLint errors are now enforced during builds
  // This prevents shipping code with type errors to production
  // If you need to temporarily disable for CI/CD, use environment variables:
  // eslint: { ignoreDuringBuilds: process.env.SKIP_LINT === 'true' },
  // typescript: { ignoreBuildErrors: process.env.SKIP_TYPE_CHECK === 'true' },
  
  images: {
    unoptimized: true,
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Optimize bundle size
  modularizeImports: {
    '@tabler/icons-react': {
      transform: '@tabler/icons-react/dist/esm/icons/{{member}}',
    },
  },

  // Production optimizations
  swcMinify: true,
  poweredByHeader: false,
}

export default withNextIntl(nextConfig)
