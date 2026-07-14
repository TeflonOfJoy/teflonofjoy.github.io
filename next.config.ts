import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@sparticuz/chromium"],
  async redirects() {
    return [
      {
        source: "/til/:path(rss|RSS|Rss|feed|Feed)",
        destination: "/til/rss.xml",
        permanent: true,
      },
      {
        source: "/sites/:path(rss|RSS|Rss|feed|Feed)",
        destination: "/sites/rss.xml",
        permanent: true,
      },
      {
        source: "/book-digest/:path(rss|RSS|Rss|feed|Feed)",
        destination: "/book-digest/rss.xml",
        permanent: true,
      },
      {
        source: "/stack/:path(rss|RSS|Rss|feed|Feed)",
        destination: "/stack/rss.xml",
        permanent: true,
      },
    ];
  },
  devIndicators: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    qualities: [100, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagedelivery.net",
      },
      // Notion CDN domains for uploaded files
      {
        protocol: "https",
        hostname: "prod-files-secure.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "s3.us-west-2.amazonaws.com",
      },
      // R2 public bucket (assets.teflonofjoy.dev)
      {
        protocol: "https",
        hostname: "assets.teflonofjoy.dev",
      },
      {
        protocol: "https",
        hostname: "cdn.thestorygraph.com",
      },
    ],
  },
};

export default nextConfig;
