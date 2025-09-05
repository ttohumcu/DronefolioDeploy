import { useState, useRef, useEffect } from "react";

interface LazyImageProps {
  src: string;
  thumbnailUrl?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  loadFullImageImmediately?: boolean; // Control when to load full image
}

interface LazyImageWithRefProps extends LazyImageProps {
  ref?: React.RefObject<HTMLImageElement>;
}

export function LazyImage({ src, thumbnailUrl, alt, className, onLoad, onError, loadFullImageImmediately = false }: LazyImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageInView, setImageInView] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [shouldLoadFullImage, setShouldLoadFullImage] = useState(false);
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

  const handleThumbnailLoad = () => {
    setThumbnailLoaded(true);
    
    // Only start loading full image if configured to do so immediately
    // Otherwise, wait for user interaction
    if (loadFullImageImmediately && thumbnailUrl) {
      // Add delay to prevent network congestion
      setTimeout(() => {
        setShouldLoadFullImage(true);
      }, 1500); // 1.5 second delay
    }
  };

  // Trigger full image loading (for user interactions like click/hover)
  const triggerFullImageLoad = () => {
    if (thumbnailUrl && !shouldLoadFullImage) {
      setShouldLoadFullImage(true);
    }
  };

  // Effect to load full image when triggered
  useEffect(() => {
    if (shouldLoadFullImage && !imageLoaded && thumbnailUrl) {
      const fullImg = new Image();
      fullImg.onload = handleLoad;
      fullImg.onerror = handleError;
      fullImg.src = src;
    }
  }, [shouldLoadFullImage, imageLoaded, thumbnailUrl, src]);

  // Determine what to show
  const showThumbnail = imageInView && thumbnailUrl && !imageLoaded;
  const showFullImage = imageInView && thumbnailUrl && imageLoaded;
  const showDirectImage = imageInView && !thumbnailUrl;

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

      {/* Thumbnail image */}
      {showThumbnail && (
        <img
          src={thumbnailUrl}
          alt={alt}
          className={`${className} transition-all duration-300`}
          onLoad={handleThumbnailLoad}
          onError={handleError}
          onMouseEnter={triggerFullImageLoad} // Load full image on hover for better UX
        />
      )}

      {/* Full image (when loaded) */}
      {showFullImage && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-500 opacity-100`}
          onError={handleError}
        />
      )}

      {/* Direct load (no thumbnail) */}
      {showDirectImage && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}