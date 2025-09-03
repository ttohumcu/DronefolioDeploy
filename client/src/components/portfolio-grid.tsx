import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { MediaType, type MediaItem } from "@shared/schema";
import { useState } from "react";
import { ImageZoomModal } from "@/components/image-zoom-modal";
import { VirtualizedGrid } from "@/components/virtualized-grid";
import { useToast } from "@/hooks/use-toast";

interface PortfolioGridProps {
  onOpenViewer: (item: MediaItem) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string;
  locationFilter: string;
  isAuthenticated?: boolean;
  onEditItem?: (item: MediaItem) => void;
}

export function PortfolioGrid({ onOpenViewer, searchQuery, setSearchQuery, activeFilter, locationFilter, isAuthenticated = false, onEditItem }: PortfolioGridProps) {
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const { toast } = useToast();

  const { data: mediaItems = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ["/api/media"],
  });

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/media/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      toast({
        title: "Media Deleted",
        description: "The media item has been successfully deleted.",
      });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast({
        title: "Delete Failed", 
        description: "Could not delete the media item. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteMediaMutation.mutate(id);
    }
  };

  const handleEdit = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    onEditItem?.(item);
  };


  // Filter media items
  const filteredItems = mediaItems.filter((item: MediaItem) => {
    // Handle search - match any partial text in title or location
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      (item.title || '').toLowerCase().includes(query) ||
      (item.location || '').toLowerCase().includes(query);
    
    // Check if video is from YouTube (using source field)
    const isYouTubeVideo = item.mediaType === MediaType.VIDEO && 
                          (item as any).source === "youtube_import";
    
    // Handle special filters
    const matchesType = activeFilter === "All" || 
                       (activeFilter === "YouTube" && isYouTubeVideo) ||
                       (activeFilter === "Videos" && item.mediaType === MediaType.VIDEO && !isYouTubeVideo) ||
                       (activeFilter === MediaType.PHOTO_4K && item.mediaType === MediaType.PHOTO_4K) ||
                       (activeFilter !== "YouTube" && activeFilter !== "Videos" && activeFilter !== MediaType.PHOTO_4K && item.mediaType === activeFilter);
    
    const matchesLocation = locationFilter === "All Locations" || item.location === locationFilter;

    return matchesSearch && matchesType && matchesLocation;
  });

  // Separate YouTube videos and regular videos from other media
  const youtubeVideos = filteredItems.filter(item => 
    item.mediaType === MediaType.VIDEO && 
    (item as any).source === "youtube_import"
  );
  const regularVideos = filteredItems.filter(item => 
    item.mediaType === MediaType.VIDEO && 
    (item as any).source !== "youtube_import"
  );
  const otherMedia = filteredItems.filter(item => item.mediaType !== MediaType.VIDEO);

  // Group non-video items by type, and add regular videos back to the grouping
  const nonYouTubeItems = [...otherMedia, ...regularVideos];
  const groupedItems = nonYouTubeItems.reduce((acc: Record<string, MediaItem[]>, item: MediaItem) => {
    if (!acc[item.mediaType]) {
      acc[item.mediaType] = [];
    }
    acc[item.mediaType].push(item);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return null; // Show hero section when no items
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Optimized Media Grid */}
        <div className="space-y-16">
          {Object.entries(groupedItems).map(([mediaType, items]) => (
            <div key={mediaType}>
              <h3 className="text-3xl font-bold text-foreground mb-8">{mediaType}</h3>
              <VirtualizedGrid
                items={items}
                onItemClick={(item) => {
                  if (item.mediaType === MediaType.VIDEO) {
                    onOpenViewer(item);
                  } else {
                    setSelectedImage(item);
                    setZoomModalOpen(true);
                  }
                }}
                isAuthenticated={isAuthenticated}
                onEditItem={onEditItem}
                onDeleteItem={handleDelete}
                deleteLoading={deleteMediaMutation.isPending}
              />
            </div>
          ))}
          
          {/* YouTube Videos Section - After other media */}
          {youtubeVideos.length > 0 && (
            <div>
              <h3 className="text-3xl font-bold text-foreground mb-8">YouTube</h3>
              <VirtualizedGrid
                items={youtubeVideos.map(item => ({ ...item, isYouTube: true }))}
                onItemClick={onOpenViewer}
                isAuthenticated={isAuthenticated}
                onEditItem={onEditItem}
                onDeleteItem={handleDelete}
                deleteLoading={deleteMediaMutation.isPending}
              />
            </div>
          )}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No media items found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {selectedImage && (
        <ImageZoomModal
          isOpen={zoomModalOpen}
          onClose={() => {
            setZoomModalOpen(false);
            setSelectedImage(null);
          }}
          imageUrl={selectedImage.url}
          thumbnailUrl={selectedImage.thumbnailUrl || undefined}
          title={selectedImage.title}
        />
      )}
    </section>
  );
}
