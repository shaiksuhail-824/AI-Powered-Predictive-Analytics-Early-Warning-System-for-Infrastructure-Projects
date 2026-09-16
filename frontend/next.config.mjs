/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const defaultBackend = process.env.NODE_ENV === 'production' ? 'http://backend:8000' : 'http://127.0.0.1:8000';
    const raw = process.env.BACKEND_URL || process.env.INTERNAL_API_URL || defaultBackend;
    const backendUrl = raw.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
