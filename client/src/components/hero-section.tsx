import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaType, type MediaItem, type Setting } from "@shared/schema";

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  locationFilter: string;
  setLocationFilter: (filter: string) => void;
  mediaItems: MediaItem[];
}

export function HeroSection({ searchQuery, onSearchChange, activeFilter, setActiveFilter, locationFilter, setLocationFilter, mediaItems }: HeroSectionProps) {
  // Get unique locations for filter dropdown
  const locations = Array.from(new Set(mediaItems.map((item: MediaItem) => item.location))).sort();
  const { data: settings } = useQuery<Setting[]>({
    queryKey: ["/api/settings"],
  });

  // Find hero image URL from settings
  const heroImageSetting = settings?.find((s: any) => s.key === 'hero_image_url');
  const backgroundImage = heroImageSetting?.value || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&h=1380';

  const hasPortfolioItems = mediaItems.length > 0;

  return (
    <section className="hero-gradient pt-16 h-48 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src={backgroundImage}
          alt="Aerial view of city with river and bridges" 
          className="w-full h-full object-cover opacity-20"
        />
      </div>
      
      {/* Title Section - Centered with padding */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 mb-6">
        <div className="text-center max-w-2xl mx-auto">
          {!hasPortfolioItems ? (
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Your Portfolio Awaits
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Login as an admin to upload your first shot.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 drop-shadow-lg">
                Explore the Portfolio
              </h2>
            </div>
          )}
        </div>
      </div>

      {/* Filter Controls and Search Bar - Full Width Edge to Edge */}
      {mediaItems.length > 0 ? (
        <div className="relative z-10 w-full">
          <div className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8">
            {/* Left side - Filter Buttons */}
            <div className="flex items-center space-x-2 flex-shrink-0">
              {["All", MediaType.PHOTO_4K, MediaType.PANORAMA_180, MediaType.PANORAMA_360, MediaType.VIDEO].map((filter) => (
                <Button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  size="sm"
                  className={`text-xs ${
                    activeFilter === filter
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-white/80 text-black hover:bg-white/90'
                  }`}
                  data-testid={`button-filter-${filter.toLowerCase().replace(/[°\s]/g, '')}`}
                >
                  {filter === MediaType.PHOTO_4K ? "Photo" :
                   filter === MediaType.PANORAMA_180 ? "180°" :
                   filter === MediaType.PANORAMA_360 ? "360°" :
                   filter === MediaType.VIDEO ? "Videos" : filter}
                </Button>
              ))}
            </div>
            
            {/* Center - Search Bar */}
            <div className="relative flex-1 mx-6">
              <Input
                type="text"
                placeholder="Search by Title or Location"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-6 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl text-black placeholder-gray-500 text-base"
                data-testid="input-search"
              />
              <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
            </div>
            
            {/* Right side - Location Filter */}
            <div className="flex-shrink-0">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-40 bg-white/80 text-black rounded-xl border border-white/20">
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
        </div>
      ) : (
        <div className="relative z-10 px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Search by Title or Location"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-6 py-3 bg-white/90 backdrop-blur-sm border border-white/20 rounded-xl text-black placeholder-gray-500 text-base"
              data-testid="input-search"
            />
            <i className="fas fa-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
          </div>
        </div>
      )}
    </section>
  );
}
