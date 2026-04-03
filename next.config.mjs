/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/dashboard/:id",
        destination: "/reflections/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
