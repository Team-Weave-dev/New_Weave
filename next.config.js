/** @type {import('next').NextConfig} */
const nextConfig = {
  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "github.com",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ['image/avif', 'image/webp'], // AVIF 우선 (더 나은 압축)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일 캐시
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 실험적 최적화 기능들
  experimental: {
    // 패키지 임포트 최적화 - 번들 크기 감소
    optimizePackageImports: [
      'lucide-react',
      '@heroicons/react',
      'date-fns',
      'lodash-es',
      'recharts',
      'react-use',
      '@tanstack/react-table',
      'xlsx',
      'jspdf',
      'react-dropzone',
      'zustand'
    ],
    
    // CSS 청킹 최적화 - CSS 파일 크기 및 요청 수 최적화
    cssChunking: 'strict',
    
    // 프리로드 최적화 - 초기 메모리 사용량 감소
    preloadEntriesOnStart: false,
    
    // CSS 최적화
    optimizeCss: true,
  },

  // Webpack 캐시 최적화 설정 (실제 환경에서는 기본 설정 사용)
  webpack: (config, { dev }) => {
    if (dev) {
      // 개발 환경에서만 메모리 생성 제한으로 성능 향상
      if (config.cache && config.cache.type === 'filesystem') {
        config.cache.maxMemoryGenerations = 1;
      }
    }
    
    return config;
  },

  // 개발 환경 최적화
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development', // 개발시에만 풀 URL 로깅
    },
  },

  // 압축 및 성능 최적화
  compress: true,
  
  // 빌드 최적화
  swcMinify: true, // SWC 기반 최적화된 압축
  
  // 온디맨드 엔트리 최적화 (개발 환경)
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 60초 (기본 25초에서 증가)
    pagesBufferLength: 5, // 동시 보관 페이지 수 (기본 2에서 증가)
  },

  // 프로덕션 최적화
  ...(process.env.NODE_ENV === 'production' && {
    // 프로덕션에서만 적용되는 최적화
    productionBrowserSourceMaps: false, // 소스맵 비활성화로 메모리 절약
    eslint: {
      ignoreDuringBuilds: false, // ESLint 검사 유지 (품질 보장)
    },
    typescript: {
      ignoreBuildErrors: false, // TypeScript 에러 검사 유지 (품질 보장)
    },
  }),

  // Webpack 설정
  webpack: (config, { isServer, dev }) => {
    // 프로덕션 빌드 최적화
    if (!dev) {
      // Tree Shaking 강화
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
        minimize: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // 벤더 청크 분리
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true,
            },
            // 공통 청크
            common: {
              minChunks: 2,
              priority: -10,
              reuseExistingChunk: true,
            },
            // 세무 관리 청크
            tax: {
              test: /[\\/]src[\\/]components[\\/]tax[\\/]/,
              name: 'tax-management',
              priority: 20,
              reuseExistingChunk: true,
            },
            // UI 컴포넌트 청크
            ui: {
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              name: 'ui-components',
              priority: 15,
              reuseExistingChunk: true,
            },
            // 차트 라이브러리 청크
            charts: {
              test: /[\\/]node_modules[\\/](recharts|d3)/,
              name: 'charts',
              priority: 25,
            },
          },
        },
      };
    }
    
    return config;
  },

  // 헤더 설정
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
        ],
      },
      // 정적 자산 캐싱
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
