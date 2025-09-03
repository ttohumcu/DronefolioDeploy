import { useState, useEffect, useMemo } from "react";
import { MediaType, type MediaItem } from "@shared/schema";
import { LazyImage } from "./lazy-image";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface VirtualizedGridProps {
  items: MediaItem[];
  onItemClick: (item: MediaItem) => void;
  isAuthenticated?: boolean;
  onEditItem?: (item: MediaItem) => void;
  onDeleteItem?: (id: string, title: string) => void;
  deleteLoading?: boolean;
}

const ITEMS_PER_PAGE = 12;

export function VirtualizedGrid({ 
  items, 
  onItemClick, 
  isAuthenticated, 
  onEditItem, 
  onDeleteItem,
  deleteLoading = false 
}: VirtualizedGridProps) {
  const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(false);

  // Reset visible items when items change (filtering)
  useEffect(() => {
    setVisibleItems(ITEMS_PER_PAGE);
  }, [items]);

  const displayedItems = useMemo(() => {
    return items.slice(0, visibleItems);
  }, [items, visibleItems]);

  const hasMore = visibleItems < items.length;

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    // Simulate loading delay to prevent overwhelming the browser
    await new Promise(resolve => setTimeout(resolve, 100));
    setVisibleItems(prev => prev + ITEMS_PER_PAGE);
    setLoading(false);
  };

  const handleEdit = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    onEditItem?.(item);
  };

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    onDeleteItem?.(id, title);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedItems.map((item) => (
          <div 
            key={item.id}
            className="media-card group cursor-pointer"
            onClick={() => onItemClick(item)}
            data-testid={`card-media-${item.id}`}
          >
            <div className="relative aspect-video rounded-xl overflow-hidden bg-card">
              <LazyImage
                src={item.mediaType === MediaType.VIDEO ? getYoutubeThumbnail(item.url) : (item.url)}
                thumbnailUrl={item.thumbnailUrl || undefined}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
                {isAuthenticated && (
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm relative z-20"
                      onClick={(e) => handleEdit(e, item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Pencil className="h-4 w-4 text-white" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm relative z-20"
                      onClick={(e) => handleDelete(e, item.id, item.title)}
                      disabled={deleteLoading}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </div>
                )}
                {item.mediaType === MediaType.VIDEO ? (
                  <i className="fas fa-play text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                ) : item.mediaType.includes('360°') ? (
                  <i className="fas fa-globe text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                ) : (
                  <i className="fas fa-expand text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                )}
              </div>
              
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white font-semibold text-lg mb-1 leading-tight">{item.title}</h3>
                {item.mediaType !== MediaType.VIDEO && item.location && (
                  <p className="text-white/90 font-medium text-sm">{item.location}</p>
                )}
              </div>
              
              {item.mediaType === MediaType.VIDEO && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <i className="fas fa-play text-white text-4xl opacity-80 group-hover:opacity-100 transition-opacity"></i>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center">
          <Button
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            className="min-w-32"
            data-testid="button-load-more"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
                <span>Loading...</span>
              </div>
            ) : (
              `Load More (${items.length - visibleItems} remaining)`
            )}
          </Button>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-xl text-muted-foreground">No media items found.</p>
        </div>
      )}
    </div>
  );
}

function getYoutubeThumbnail(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  
  return 'https://pixabay.com/get/gf0061aa8400aefd38c239eccb8882a3b8eb2f48c825880ccbfc095dca661496e8d4e65ef7b999db714e03ba1550a0d91d70ae61d017aa8ccfa178c312c71a3bb_1280.jpg';
}