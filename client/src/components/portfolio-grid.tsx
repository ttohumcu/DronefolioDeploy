import { useQuery } from "@tanstack/react-query";
import { MediaType, type MediaItem } from "@shared/schema";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ImageZoomModal } from "@/components/image-zoom-modal";

interface PortfolioGridProps {
  onOpenViewer: (item: MediaItem) => void;
}

export function PortfolioGrid({ onOpenViewer }: PortfolioGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);

  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ["/api/media"],
  });

  // Get unique locations for filter dropdown
  const locations = Array.from(new Set(mediaItems.map((item: MediaItem) => item.location))).sort();

  // Filter media items
  const filteredItems = mediaItems.filter((item: MediaItem) => {
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    
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
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl sm:text-6xl font-black text-foreground mb-6">
            DroneFolio
          </h1>
          <p className="text-xl text-muted-foreground mb-12">
            Aerial Photography & Videography
          </p>
          
          {/* Search Bar */}
          <div className="max-w-lg mx-auto mb-12">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by Title or Location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 bg-input border border-border rounded-xl text-foreground placeholder-muted-foreground text-lg pr-12"
                data-testid="input-search"
              />
              <i className="fas fa-search absolute right-6 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {["All", MediaType.PHOTO_4K, MediaType.PANORAMA_180, MediaType.PANORAMA_360, MediaType.VIDEO].map((filter) => (
            <Button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`filter-btn px-6 py-3 rounded-xl font-medium text-sm ${
                activeFilter === filter
                  ? 'active bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
              data-testid={`button-filter-${filter.toLowerCase().replace(/[°\s]/g, '')}`}
            >
              {filter === MediaType.PHOTO_4K ? "Photo" :
               filter === MediaType.PANORAMA_180 ? "180°" :
               filter === MediaType.PANORAMA_360 ? "360°" :
               filter === MediaType.VIDEO ? "Videos" : filter}
            </Button>
          ))}
          
          <div className="ml-auto">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="px-4 py-3 bg-secondary text-secondary-foreground rounded-xl border border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Locations">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                      
                      <div className="absolute top-4 right-4">
                        {item.mediaType === MediaType.VIDEO ? (
                          <i className="fas fa-play text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        ) : item.mediaType.includes('360°') ? (
                          <i className="fas fa-globe text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        ) : (
                          <i className="fas fa-expand text-white text-lg opacity-0 group-hover:opacity-100 transition-opacity"></i>
                        )}
                      </div>
                      
                      <div className="absolute bottom-4 left-4">
                        <span className="text-white font-medium text-lg">{item.location}</span>
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
