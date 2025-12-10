/** @type {import('next').NextConfig} */
const nextConfig = {

  eslint: {
    ignoreDuringBuilds: true,
  },
  // Разрешаем дев-ориджины (без протокола)
  allowedDevOrigins: [
    'dev.mysite.ru',
    '*.mysite.ru',
    'localhost',
    'localhost:3443',
  ],

  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: '127.0.0.1',  port: '8000', pathname: '/media/**' },
      { protocol: 'http',  hostname: '127.0.0.1',  port: '8000', pathname: '/api/**'   },
      { protocol: 'https', hostname: 'dev.mysite.ru', port: '3443', pathname: '/media/**' },
      { protocol: 'https', hostname: 'dev.mysite.ru', port: '3443', pathname: '/api/**'   },
      { protocol: 'https', hostname: 'st.kp.yandex.net',       pathname: '/**' },
      { protocol: 'https', hostname: 'shikimori.one',          pathname: '/**' },
      { protocol: 'https', hostname: 'static.shikimori.one',   pathname: '/**' },
      { protocol: 'https', hostname: 'dere.shikimori.one',     pathname: '/**' },
      { protocol: 'https', hostname: 'nyaa.shikimori.one',     pathname: '/**' },
      { protocol: 'https', hostname: 'avatars.mds.yandex.net', pathname: '/**' },
    ],
  },

  experimental: {
    serverActions: { bodySizeLimit: '250mb' },
  },

  async rewrites() {
    return [
      { source: '/media/:path*', destination: 'http://127.0.0.1:8000/media/:path*' },
    ];
  },
};

module.exports = nextConfig;
