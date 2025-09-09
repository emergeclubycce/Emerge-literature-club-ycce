// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['i.pinimg.com'],
  },
  eslint: {
 ignoreDuringBuilds: true,
},
};

module.exports = nextConfig;
