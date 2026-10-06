/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep x402 / Solana kits out of the Next server webpack bundle (avoids
  // broken vendor-chunks/@solana.js when the procure API signs payments).
  // Next 14 key; Next 15+ uses top-level serverExternalPackages.
  experimental: {
    serverComponentsExternalPackages: [
      "@solana/kit",
      "@x402/fetch",
      "@x402/svm",
      "@x402/core",
      "@x402/express",
      "express",
      "@scure/base",
    ],
  },
  transpilePackages: [
    "@solana/wallet-adapter-base",
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-wallets",
  ],
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
