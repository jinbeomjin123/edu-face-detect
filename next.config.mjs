/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // face-api.js references the 'canvas' package (Node.js only) — exclude from browser bundle
    config.externals = [...(config.externals ?? []), { canvas: "canvas" }];
    return config;
  },
};

export default nextConfig;
