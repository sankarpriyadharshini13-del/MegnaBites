const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;
  } catch {
    return null;
  }
})();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a verification build run alongside `next dev` without sharing .next (NEXT_DIST_DIR=.next-verify).
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    // Product photos uploaded from the admin panel are served from Supabase Storage.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

module.exports = nextConfig;
