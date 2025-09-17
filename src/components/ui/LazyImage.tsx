'use client';

import { useState, useRef, ImgHTMLAttributes } from 'react';
import { useLazyLoad } from '@/hooks/useIntersectionObserver';
import { cn } from '@/lib/utils';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  fallback?: string;
}

export function LazyImage({
  src,
  alt,
  placeholder = '/placeholder-image.svg',
  className,
  fallback = '/error-image.svg',
  ...props
}: LazyImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useLazyLoad(ref);
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Load image when visible
  if (isVisible && imageSrc === placeholder && !hasError) {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.onerror = () => {
      setImageSrc(fallback);
      setHasError(true);
      setIsLoaded(true);
    };
  }

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <img
        src={imageSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        {...props}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}
    </div>
  );
}