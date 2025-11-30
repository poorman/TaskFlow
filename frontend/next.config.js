/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Don't set env here - let it come from environment variables
  // This allows production to use the correct API URL
  // output: 'standalone', // Commented out - only use if deploying with Docker and custom server
  
  // Turbopack configuration (Next.js 16 uses Turbopack by default)
  // Add empty config to silence the warning about webpack config
  turbopack: {},
  
  // Webpack config is kept for compatibility but Turbopack is preferred
  // If you need webpack-specific features, use --webpack flag or migrate to Turbopack
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure client-side modules are properly handled
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig

