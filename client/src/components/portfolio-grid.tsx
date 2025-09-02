import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { MediaType, type MediaItem } from "@shared/schema";
import { useState } from "react";
import { ImageZoomModal } from "@/components/image-zoom-modal";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
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

  const handleDelete = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
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
    
    const matchesType = activeFilter === "All" || item.mediaType === activeFilter;
    
    const matchesLocation = locationFilter === "All Locations" || item.location === locationFilter;

    return matchesSearch && matchesType && matchesLocation;
  });

  // Group items by type
  const groupedItems = filteredItems.reduce((acc: Record<string, MediaItem[]>, item: MediaItem) => {
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

        {/* Media Grid */}
        <div className="space-y-16">
          {Object.entries(groupedItems).map(([mediaType, items]) => (
            <div key={mediaType}>
              <h3 className="text-3xl font-bold text-foreground mb-8">{mediaType}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <div 
                    key={item.id}
                    className="media-card group cursor-pointer"
                    onClick={() => {
                      if (item.mediaType === MediaType.VIDEO) {
                        onOpenViewer(item);
                      } else {
                        setSelectedImage(item);
                        setZoomModalOpen(true);
                      }
                    }}
                    data-testid={`card-media-${item.id}`}
                  >
                    <div className="relative aspect-video rounded-xl overflow-hidden bg-card">
                      {item.mediaType === MediaType.VIDEO ? (
                        // For YouTube videos, extract thumbnail
                        <img 
                          src={getYoutubeThumbnail(item.url)}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <img 
                          src={item.thumbnailUrl || item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      <div className="absolute top-4 right-4 flex items-center space-x-2">
                        {isAuthenticated && (
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                              onClick={(e) => handleEdit(e, item)}
                              data-testid={`button-edit-${item.id}`}
                            >
                              <Pencil className="h-4 w-4 text-white" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 w-8 p-0 bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm"
                              onClick={(e) => handleDelete(e, item.id, item.title)}
                              disabled={deleteMediaMutation.isPending}
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
                        <p className="text-white/90 font-medium text-sm">{item.location}</p>
                      </div>
                      
                      {item.mediaType === MediaType.VIDEO && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <i className="fas fa-play text-white text-4xl opacity-80 group-hover:opacity-100 transition-opacity"></i>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
          thumbnailUrl={selectedImage.thumbnailUrl}
          title={selectedImage.title}
        />
      )}
    </section>
  );
}

function getYoutubeThumbnail(url: string): string {
  // Extract video ID from various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  const videoId = (match && match[2].length === 11) ? match[2] : null;
  
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  
  // Fallback to a generic video thumbnail
  return 'https://pixabay.com/get/gf0061aa8400aefd38c239eccb8882a3b8eb2f48c825880ccbfc095dca661496e8d4e65ef7b999db714e03ba1550a0d91d70ae61d017aa8ccfa178c312c71a3bb_1280.jpg';
}
