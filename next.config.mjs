/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",             value: "ALLOWALL"     },
          { key: "Content-Security-Policy",      value: "frame-ancestors *; frame-src *; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;" },
          { key: "Access-Control-Allow-Origin",  value: "*"            },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "*"            },
          { key: "Cross-Origin-Opener-Policy",   value: "unsafe-none"  },
          { key: "Cross-Origin-Embedder-Policy", value: "unsafe-none"  },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
      {
        source: "/api/proxy",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
        ],
      },
    ]
  },
}

export default nextConfig