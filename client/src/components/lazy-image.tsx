import { useState, useRef, useEffect } from "react";

interface LazyImageProps {
  src: string;
  thumbnailUrl?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

interface LazyImageWithRefProps extends LazyImageProps {
  ref?: React.RefObject<HTMLImageElement>;
}

export function LazyImage({ src, thumbnailUrl, alt, className, onLoad, onError }: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageInView, setImageInView] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const currentImg = imgRef.current;
    if (!currentImg) return;

    // Intersection Observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageInView(true);
            observerRef.current?.unobserve(currentImg);
          }
        });
      },
      {
        rootMargin: "100px", // Load images 100px before they come into view
        threshold: 0.1,
      }
    );

    observerRef.current.observe(currentImg);

    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, []);

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setImageError(true);
    onError?.();
  };

  // Show thumbnail first if available, then load full image
  const displaySrc = imageInView ? (thumbnailUrl && !imageLoaded ? thumbnailUrl : src) : '';

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      {!imageInView && (
        <div className="absolute inset-0 bg-gray-300 dark:bg-gray-700 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
        </div>
      )}

      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}

      {/* Main image */}
      {imageInView && displaySrc && (
        <>
          {/* Thumbnail (if available) */}
          {thumbnailUrl && !imageLoaded && (
            <img
              src={thumbnailUrl}
              alt={alt}
              className={`${className} filter blur-sm scale-105 transition-all duration-300`}
              onLoad={() => {
                // Start loading full image after thumbnail loads
                const fullImg = new Image();
                fullImg.onload = handleLoad;
                fullImg.onerror = handleError;
                fullImg.src = src;
              }}
              onError={handleError}
            />
          )}

          {/* Full image */}
          {imageLoaded && (
            <img
              src={src}
              alt={alt}
              className={`${className} transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onError={handleError}
            />
          )}

          {/* Direct load (no thumbnail) */}
          {!thumbnailUrl && (
            <img
              src={src}
              alt={alt}
              className={`${className} transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </>
      )}
    </div>
  );
}