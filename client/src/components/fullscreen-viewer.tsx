import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaType, type MediaItem } from "@shared/schema";

interface FullscreenViewerProps {
  isOpen: boolean;
  mediaItem: MediaItem | null;
  onClose: () => void;
}

export function FullscreenViewer({ isOpen, mediaItem, onClose }: FullscreenViewerProps) {
  if (!mediaItem) return null;

  const isVideo = mediaItem.mediaType === MediaType.VIDEO;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="modal-backdrop max-w-[95vw] max-h-[95vh] p-0 border-none bg-transparent">
        <div className="relative w-full h-full">
          <Button
            onClick={onClose}
            className="absolute top-6 right-6 z-50 text-white hover:text-gray-300 bg-black/50 hover:bg-black/70 rounded-full p-3"
            data-testid="button-close-viewer"
          >
            <i className="fas fa-times text-xl"></i>
          </Button>
          
          <div className="absolute top-6 left-6 z-50">
            <h3 className="text-white text-2xl font-bold" data-testid="text-viewer-title">
              {mediaItem.title}
            </h3>
            <p className="text-white/80 text-lg" data-testid="text-viewer-info">
              {mediaItem.location} - {mediaItem.mediaType}
            </p>
          </div>

          <div className="w-full h-full flex items-center justify-center p-8">
            {isVideo ? (
              <div className="relative w-full max-w-6xl aspect-video">
                <iframe
                  src={getYouTubeEmbedUrl(mediaItem.url)}
                  title={mediaItem.title}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <img 
                src={mediaItem.url}
                alt={mediaItem.title}
                className="max-w-full max-h-full object-contain rounded-lg"
                data-testid="img-viewer-content"
              />
            )}
          </div>

          {!isVideo && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
              <Button className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70" data-testid="button-zoom-out">
                <i className="fas fa-minus"></i>
              </Button>
              <Button className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70" data-testid="button-reset-zoom">
                <span className="text-sm font-medium">1:1</span>
              </Button>
              <Button className="p-3 bg-black/50 text-white rounded-full hover:bg-black/70" data-testid="button-zoom-in">
                <i className="fas fa-plus"></i>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  
  return url; // Fallback to original URL
}
