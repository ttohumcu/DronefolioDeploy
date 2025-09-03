import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, X } from "lucide-react";
import { LazyImage } from "./lazy-image";

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  thumbnailUrl?: string;
  title: string;
}

export function ImageZoomModal({ isOpen, onClose, imageUrl, thumbnailUrl, title }: ImageZoomModalProps) {
  const [zoom, setZoom] = useState(1);
  const [baseZoom, setBaseZoom] = useState(1); // The "fit to screen" zoom level
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, posX: 0, posY: 0 });
  const [isFullImageLoaded, setIsFullImageLoaded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Calculate fit-to-screen zoom when image loads
  const calculateFitZoom = () => {
    if (!imageRef.current) return 1;
    
    const img = imageRef.current;
    const container = img.parentElement;
    if (!container) return 1;
    
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const imageWidth = img.naturalWidth;
    const imageHeight = img.naturalHeight;
    
    // Calculate zoom to fit entire image in viewport
    const scaleX = containerWidth / imageWidth;
    const scaleY = containerHeight / imageHeight;
    const fitZoom = Math.min(scaleX, scaleY, 1); // Don't zoom larger than 100% initially
    
    return fitZoom;
  };

  // Reset zoom and position when modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setBaseZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsFullImageLoaded(false);
      setShowFullImage(!thumbnailUrl); // If no thumbnail, show full image immediately
    }
  }, [isOpen, thumbnailUrl]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, baseZoom * 5));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, baseZoom * 0.2));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > baseZoom) {
      setDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && zoom > baseZoom) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPosition({
        x: dragStart.posX + deltaX,
        y: dragStart.posY + deltaY
      });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === '=' || e.key === '+') {
      handleZoomIn();
    } else if (e.key === '-') {
      handleZoomOut();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10 text-white hover:bg-white/20 bg-black/50"
          onClick={onClose}
          data-testid="button-close-zoom"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Zoom controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 bg-black/50"
            onClick={handleZoomOut}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 bg-black/50"
            onClick={handleZoomIn}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-5 w-5" />
          </Button>
          <div className="bg-black/50 text-white px-3 py-2 rounded text-sm">
            {Math.round((zoom / baseZoom) * 100)}%
          </div>
        </div>

        {/* Image container */}
        <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
          {/* Thumbnail placeholder while full image loads */}
          {thumbnailUrl && !showFullImage && (
            <img
              src={thumbnailUrl}
              alt={title}
              className="max-w-none select-none blur-sm scale-105 transition-all duration-500"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center center'
              }}
              draggable={false}
            />
          )}
          
          {/* Full resolution image */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt={title}
            className={`max-w-none cursor-move select-none transition-opacity duration-500 ${
              showFullImage ? 'opacity-100' : 'opacity-0 absolute'
            }`}
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transformOrigin: 'center center',
              cursor: zoom > baseZoom ? (dragging ? 'grabbing' : 'grab') : 'default'
            }}
            onMouseDown={handleMouseDown}
            onLoad={() => {
              // Calculate and set fit-to-screen zoom when image loads
              const fitZoom = calculateFitZoom();
              setBaseZoom(fitZoom);
              setZoom(fitZoom);
              setPosition({ x: 0, y: 0 });
              setIsFullImageLoaded(true);
              setShowFullImage(true);
            }}
            draggable={false}
            data-testid="img-zoom-view"
          />
          
          {/* Loading indicator */}
          {thumbnailUrl && !isFullImageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-lg p-4">
                <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded text-sm">
          Use +/- keys or buttons to zoom • Drag to pan • ESC to close
        </div>
      </DialogContent>
    </Dialog>
  );
}