/** @type {import('next').NextConfig} */
const nextConfig = {
  // React StrictMode 활성화 (@hello-pangea/dnd는 StrictMode를 완벽하게 지원)
  reactStrictMode: true,
  
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
    formats: ['image/webp', 'image/avif'], // 최적화된 형식 우선 사용
    minimumCacheTTL: 86400, // 24시간 캐시 (60초 → 24시간으로 향상)
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
      'react-use'
    ],
    
    // CSS 청킹 최적화 - CSS 파일 크기 및 요청 수 최적화
    cssChunking: 'strict',
    
    // 프리로드 최적화 - 초기 메모리 사용량 감소
    preloadEntriesOnStart: false,
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
};

export default nextConfig;
