/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  publicRuntimeConfig: {
    // Will be available on both server and client
    conversion: {
      shukran: 500,
      aed: 1
    }
  },
}

module.exports = nextConfig
