/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize Next.js build
  swcMinify: true,
  // Configure environment variables (production)
  env: {
    MARKER_PORT: process.env.MARKER_PORT,
    TORCH_DEVICE: process.env.TORCH_DEVICE,
  },
}

module.exports = nextConfig
