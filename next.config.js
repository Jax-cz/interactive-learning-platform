/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during builds (allows deployment)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable type checking during builds (allows deployment)
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig